import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { CookieOptions, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { z } from 'zod';

import config from '../config';
import User, { UserDoc } from '../models/User';
import logger from '../utils/logger';

const JWT_ALG: jwt.Algorithm = 'HS256';
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const NAME_REGEX = /^[\p{L}][\p{L}\p{M}.'\- ]*$/u;

type AuthenticatedRequest = Request & { auth?: { sub?: string; [key: string]: unknown } };

const EmailSchema = z
  .string()
  .trim()
  .regex(EMAIL_REGEX, 'Invalid email')
  .transform((value) => value.toLowerCase());

export const RegisterSchema = z.object({
  firstName: z.string().trim().min(1).regex(NAME_REGEX, 'Invalid first name'),
  lastName: z.string().trim().min(1).regex(NAME_REGEX, 'Invalid last name'),
  email: EmailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const LoginSchema = z.object({
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
  const referer = req.get('referer');
  if (!referer) return undefined;
  if (referer?.includes('.lingodrill.com')) return '.lingodrill.com';
  if (referer?.includes('.henryk.co.za')) return '.henryk.co.za';

  try {
    const { hostname } = new URL(referer);
    const allowed = config.corsAllowOrigins.some((origin) => {
      try {
        const allowedHost = new URL(origin).hostname;
        return hostname === allowedHost || hostname.endsWith(`.${allowedHost}`);
      } catch {
        return false;
      }
    });
    return allowed ? `.${hostname.split('.').slice(-2).join('.')}` : undefined;
  } catch {
    return undefined;
  }
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

  ['access_token', 'refresh_token'].forEach((name) => {
    res.clearCookie(name, opts);
    res.cookie(name, '', { ...opts, expires: new Date(0), maxAge: 0 });
  });
};

const signAccessToken = (user: UserDoc) => {
  const options: jwt.SignOptions = { algorithm: JWT_ALG, expiresIn: ACCESS_EXPIRES_IN };
  return jwt.sign({ sub: user._id.toString(), email: user.email }, config.jwt.secret, options);
};

const signRefreshToken = (user: UserDoc, sid: string) => {
  const options: jwt.SignOptions = { algorithm: JWT_ALG, expiresIn: REFRESH_EXPIRES_IN };
  return jwt.sign({ sub: user._id.toString(), email: user.email, sid }, config.jwt.refreshSecret, options);
};

const addSession = async (user: UserDoc, plainRefresh: string, sid: string, req: Request) => {
  user.refreshSessions = user.refreshSessions ?? [];
  const tokenHash = await bcrypt.hash(plainRefresh, 12);
  user.refreshSessions.push({
    sid,
    tokenHash,
    userAgent: req.get('user-agent'),
    ip: req.ip,
  });
  if (user.refreshSessions.length > Number(config.jwt.maxSessions)) {
    user.refreshSessions.splice(0, user.refreshSessions.length - Number(config.jwt.maxSessions));
  }
  await user.save();
};

const findSessionIndexBySid = (user: UserDoc, sid: string) => {
  if (!user.refreshSessions) return -1;
  return user.refreshSessions.findIndex((session) => session.sid === sid);
};

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName } = req.body as z.infer<typeof RegisterSchema>;

      const exists = await User.findOne({ email });
      if (exists) return res.status(409).json({ error: 'Email already in use' });

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await User.create({ email, passwordHash, firstName, lastName });

      const access = signAccessToken(user);
      const sid = randomUUID();
      const refresh = signRefreshToken(user, sid);

      const refreshHash = await bcrypt.hash(refresh, 12);
      user.refreshTokenHash = refreshHash;
      await user.save();

      setAccessCookie(req, res, access);
      setRefreshCookie(req, res, refresh);
      return res.status(201).json({ ok: true, user: { id: user._id, email: user.email } });
    } catch (e) {
      logger.error({ err: e }, 'Authentication Error');
      return res.status(500).json({ error: 'Server error' });
    }
  }

  async login(req: Request, res: Response) {
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
      return res.json({ ok: true, user: { id: user._id, email: user.email } });
    } catch (e) {
      logger.error({ err: e }, 'Authentication Error');
      return res.status(500).json({ error: 'Server error' });
    }
  }

  async getMe(req: AuthenticatedRequest, res: Response) {
    const userId = req.auth?.sub;
    if (!userId) return res.status(401).json({ error: 'Invalid or missing access token' });
    const user = await User.findById(userId).select('_id email');
    return res.json({ user });
  }

  async refresh(req: Request, res: Response) {
    try {
      const token = req.cookies?.refresh_token;
      if (!token) return res.status(401).json({ error: 'Missing refresh token' });

      let payload: jwt.JwtPayload | string;
      try {
        payload = jwt.verify(token, config.jwt.refreshSecret, { algorithms: [JWT_ALG] });
      } catch {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      if (
        typeof payload === 'string' ||
        typeof payload.sub !== 'string' ||
        typeof (payload as jwt.JwtPayload).sid !== 'string'
      ) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      const user = await User.findById(payload.sub);
      if (!user) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      user.refreshSessions = user.refreshSessions ?? [];

      const idx = findSessionIndexBySid(user, payload.sid);
      if (idx === -1) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      const newAccess = signAccessToken(user);
      const newRefresh = signRefreshToken(user, payload.sid);

      user.refreshSessions[idx].tokenHash = await bcrypt.hash(newRefresh, 12);
      user.refreshSessions[idx].lastUsedAt = new Date();
      user.refreshSessions[idx].userAgent = req.get('user-agent');
      user.refreshSessions[idx].ip = req.ip;

      await user.save();

      setAccessCookie(req, res, newAccess);
      setRefreshCookie(req, res, newRefresh);
      return res.json({ ok: true });
    } catch (e) {
      logger.error({ err: e }, 'Authentication Error');
      return res.status(500).json({ error: 'Server error' });
    }
  }

  async logout(req: Request, res: Response) {
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
              user.refreshSessions.splice(idx, 1);
              await user.save();
            }
          }
        }
      }
    } finally {
      clearAuthCookies(res);
      res.set('Cache-Control', 'no-store');
      res.json({ ok: true });
    }
  }

  async logoutAll(req: Request, res: Response) {
    const token = req.cookies?.refresh_token;
    const payload = token ? (jwt.decode(token) as jwt.JwtPayload | null) : null;
    if (payload?.sub) {
      await User.findByIdAndUpdate(payload.sub, { $set: { refreshSessions: [] } });
    }
    clearAuthCookies(res);
    res.set('Cache-Control', 'no-store');
    return res.json({ ok: true });
  }
}

export const authController = new AuthController();
