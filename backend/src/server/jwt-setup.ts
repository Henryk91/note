import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { Application, CookieOptions, NextFunction, Request, Response } from 'express';
import { expressjwt as jwtMiddleware } from 'express-jwt';
import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { z } from 'zod';

import config from './config';
import User from './models/User';

const JWT_ALG: jwt.Algorithm = 'HS256';
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const NAME_REGEX = /^[\p{L}][\p{L}\p{M}.'\- ]*$/u;

type AuthenticatedRequest = Request & { auth?: { sub?: string; [key: string]: unknown } };

const EmailSchema = z
  .string()
  .trim()
  .regex(EMAIL_REGEX, 'Invalid email')
  .transform((value) => value.toLowerCase());

const RegisterSchema = z.object({
  firstName: z.string().trim().min(1).regex(NAME_REGEX, 'Invalid first name'),
  lastName: z.string().trim().min(1).regex(NAME_REGEX, 'Invalid last name'),
  email: EmailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const durationToMs = (value: string, fallback: number) => {
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) return fallback;
  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return amount * (multipliers[unit] ?? 1) || fallback;
};

const ACCESS_MAX_AGE_MS = durationToMs(config.jwt.accessExpiresIn, 15 * 60 * 1000);
const REFRESH_MAX_AGE_MS = durationToMs(config.jwt.refreshExpiresIn, 30 * 24 * 60 * 60 * 1000);
const COOKIE_SAMESITE: CookieOptions['sameSite'] = config.secureCookies ? 'none' : 'lax';
const ACCESS_EXPIRES_IN = config.jwt.accessExpiresIn as StringValue;
const REFRESH_EXPIRES_IN = config.jwt.refreshExpiresIn as StringValue;

const getRequestDomain = (req: Request) => {
  const referer = req?.headers?.referer;
  // whitelist and derive domain safely
  if (referer?.includes('.lingodrill.com')) {
    return '.lingodrill.com'; // share across all lingodrill subdomains
  }
  if (referer?.includes('.henryk.co.za')) {
    return '.henryk.co.za'; // share across henryk.co.za subdomains
  }
  return undefined; // default: host-only
};

const createValidationMiddleware =
  <T>(schema: z.ZodSchema<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
    }
    req.body = parsed.data as typeof req.body;
    return next();
  };

const setAccessCookie = (req: Request, res: Response, token: string) => {
  const domain = getRequestDomain(req);
  res.cookie('access_token', token, {
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: COOKIE_SAMESITE,
    maxAge: ACCESS_MAX_AGE_MS,
    path: '/',
    domain,
  });
};

const setRefreshCookie = (req: Request, res: Response, token: string) => {
  const domain = getRequestDomain(req);
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: COOKIE_SAMESITE,
    maxAge: REFRESH_MAX_AGE_MS,
    path: '/',
    domain,
  });
};

const clearAuthCookies = (res: Response) => {
  const opts: CookieOptions = {
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: COOKIE_SAMESITE,
    path: '/',
  };

  for (const name of ['access_token', 'refresh_token']) {
    res.clearCookie(name, opts);
    res.cookie(name, '', { ...opts, expires: new Date(0), maxAge: 0 });
  }
};

const signAccessToken = (user: any) => {
  const options: jwt.SignOptions = { algorithm: JWT_ALG, expiresIn: ACCESS_EXPIRES_IN };
  return jwt.sign({ sub: user._id.toString(), email: user.email }, config.jwt.secret, options);
};

const signRefreshToken = (user: any, sid: string) => {
  const options: jwt.SignOptions = { algorithm: JWT_ALG, expiresIn: REFRESH_EXPIRES_IN };
  return jwt.sign({ sub: user._id.toString(), email: user.email, sid }, config.jwt.refreshSecret, options);
};

const addSession = async (user: any, plainRefresh: string, sid: string, req: Request) => {
  user.refreshSessions = user.refreshSessions ?? [];
  const tokenHash = await bcrypt.hash(plainRefresh, 12);
  user.refreshSessions.push({
    sid,
    tokenHash,
    userAgent: req.get('user-agent'),
    ip: req.ip,
  });
  if (user.refreshSessions.length > Number(config.jwt.maxSessions)) {
    user.refreshSessions = user.refreshSessions.slice(1);
  }
  await user.save();
};

const findSessionIndexBySid = (user: any, sid: string) => {
  if (!user.refreshSessions) return -1;
  return user.refreshSessions.findIndex((session: any) => session.sid === sid);
};

const jwtSetup = (app: Application) => {
  // ---- Register ----
  app.post('/api/register', createValidationMiddleware(RegisterSchema), async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName } = req.body as z.infer<typeof RegisterSchema>;

      const exists = await User.findOne({ email });
      if (exists) return res.status(409).json({ error: 'Email already in use' });

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await User.create({ email, passwordHash, firstName, lastName });

      const access = signAccessToken(user);
      const sid = randomUUID();
      const refresh = signRefreshToken(user, sid);

      // store hashed refresh token (rotation baseline)
      const refreshHash = await bcrypt.hash(refresh, 12);
      user.refreshTokenHash = refreshHash;
      await user.save();

      setAccessCookie(req, res, access);
      setRefreshCookie(req, res, refresh);
      res.status(201).json({ ok: true, user: { id: user._id, email: user.email } });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // ---- Login ----
  app.post('/api/login', createValidationMiddleware(LoginSchema), async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body as z.infer<typeof LoginSchema>;

      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

      const access = signAccessToken(user);
      const sid = randomUUID();
      const refresh = signRefreshToken(user, sid);

      await addSession(user, refresh, sid, req);

      setAccessCookie(req, res, access);
      setRefreshCookie(req, res, refresh);
      res.json({ ok: true, user: { id: user._id, email: user.email } });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // ---- Protect API (reads access token from cookie) ----
  app.use(
    '/api',
    jwtMiddleware({
      secret: config.jwt.secret,
      algorithms: [JWT_ALG],
      getToken: (req) => req.cookies?.access_token || null,
    }).unless({
      path: [
        '/api/refresh',
        '/api/login',
        '/api/log',
        '/api/register',
        '/api/emails',
        '/api/email',
        '/api/translate-practice',
        '/api/translate-levels',
        '/api/full-translate-practice',
        '/api/saved-translation',
        '/api/translate',
        '/api/confirm-translation',
        /^\/api\/log\/.*/,
        /^\/api\/dash-data\/.*/,
      ],
    })
  );

  app.get('/api/me', async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth?.sub;
    if (!userId) return res.status(401).json({ error: 'Invalid or missing access token' });
    const user = await User.findById(userId).select('_id email');
    res.json({ user });
  });

  // ---- Refresh endpoint (token rotation) ----
  app.post('/api/refresh', async (req: Request, res: Response) => {
    try {
      const token = req.cookies?.refresh_token;
      if (!token) return res.status(401).json({ error: 'Missing refresh token' });

      let payload: jwt.JwtPayload | string;
      try {
        payload = jwt.verify(token, config.jwt.refreshSecret, { algorithms: [JWT_ALG] });
      } catch {
        console.log("Can't verify refresh_token");
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      if (typeof payload === 'string' || typeof payload.sub !== 'string' || typeof (payload as any).sid !== 'string') {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      const user = await User.findById(payload.sub);
      if (!user) {
        console.log('No user from payload.sub');
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      user.refreshSessions = user.refreshSessions ?? [];

      const idx = findSessionIndexBySid(user, payload.sid);
      if (idx === -1) {
        console.log('Login session no longer available');
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      // Rotate this session only
      const newAccess = signAccessToken(user);
      const newRefresh = signRefreshToken(user, payload.sid);

      user.refreshSessions[idx].tokenHash = await bcrypt.hash(newRefresh, 12);
      user.refreshSessions[idx].lastUsedAt = new Date();
      user.refreshSessions[idx].userAgent = req.get('user-agent');
      user.refreshSessions[idx].ip = req.ip;

      await user.save();

      setAccessCookie(req, res, newAccess);
      setRefreshCookie(req, res, newRefresh);
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // ---- Logout (revoke refresh, clear cookies) ----
  app.post('/api/logout', async (req: Request, res: Response) => {
    try {
      const token = req.cookies?.refresh_token;
      if (token) {
        const payload = (() => {
          try {
            return jwt.decode(token);
          } catch {
            return null;
          }
        })();
        if (payload && typeof payload !== 'string' && payload.sub) {
          const user = await User.findById(payload.sub);
          if (user) {
            user.refreshSessions = user.refreshSessions ?? [];
            const sid = typeof payload.sid === 'string' ? payload.sid : undefined;
            const idx = sid ? findSessionIndexBySid(user, sid) : -1;
            if (idx !== -1) {
              user.refreshSessions.splice(idx, 1); // remove only this device
              await user.save();
            }
          }
        }
      }
    } finally {
      console.log('Clear auth Cookies');
      clearAuthCookies(res);
      res.set('Cache-Control', 'no-store');
      res.json({ ok: true });
    }
  });

  app.post('/api/logout-all', async (req: Request, res: Response) => {
    const token = req.cookies?.refresh_token;
    const payload: any = token ? jwt.decode(token) : null;
    if (payload?.sub) {
      await User.findByIdAndUpdate(payload.sub, { $set: { refreshSessions: [] } });
    }
    clearAuthCookies(res);
    res.set('Cache-Control', 'no-store');
    res.json({ ok: true });
  });

  // ---- Auth error handler for express-jwt ----
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({ error: 'Invalid or missing access token' });
    }
    next(err);
  });
};

export default jwtSetup;
