/* eslint-disable func-names */
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { expressjwt: jwtMiddleware } = require('express-jwt');

const Handler = require('./controllers/handlers.js');
const dbHandler = new Handler();

const User = require('./models/User');

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
const JWT_ALG = 'HS256';

const ACCESS_EXPIRES = '15m'; // short-lived access token
const REFRESH_EXPIRES = '30d'; // long-lived refresh token
const ACCESS_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // ~30 days

module.exports = function (app) {
  // ---- Cookie helpers ----
  function setAccessCookie(res, token) {
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: false, // set true in production (HTTPS)
      sameSite: 'lax',
      maxAge: ACCESS_MAX_AGE_MS,
      path: '/',
    });
  }

  function setRefreshCookie(res, token) {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: false, // set true in production (HTTPS)
      sameSite: 'lax',
      maxAge: REFRESH_MAX_AGE_MS,
      path: '/', // you can scope to '/refresh' if you prefer
    });
  }

  function clearAuthCookies(res) {
    res.clearCookie('access_token', { httpOnly: true, secure: false, sameSite: 'lax', path: '/' });
    res.clearCookie('refresh_token', { httpOnly: true, secure: false, sameSite: 'lax', path: '/' });
  }

  // ---- JWT helpers ----
  function signAccessToken(user) {
    return jwt.sign({ sub: user._id.toString(), email: user.email }, JWT_SECRET, {
      algorithm: JWT_ALG,
      expiresIn: ACCESS_EXPIRES,
    });
  }

  function signRefreshToken(user) {
    return jwt.sign({ sub: user._id.toString(), email: user.email }, REFRESH_SECRET, {
      algorithm: JWT_ALG,
      expiresIn: REFRESH_EXPIRES,
    });
  }

  // ---- Register ----
  app.post('/api/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body || {};
      if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

      const exists = await User.findOne({ email });
      if (exists) return res.status(409).json({ error: 'Email already in use' });

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await User.create({ email, passwordHash, firstName, lastName });

      // issue tokens
      const access = signAccessToken(user);
      const refresh = signRefreshToken(user);

      // store hashed refresh token (rotation baseline)
      const refreshHash = await bcrypt.hash(refresh, 12);
      user.refreshTokenHash = refreshHash;
      await user.save();

      setAccessCookie(res, access);
      setRefreshCookie(res, refresh);
      res.status(201).json({ ok: true, user: { id: user._id, email: user.email } });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // ---- Login ----
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

      const access = signAccessToken(user);
      const refresh = signRefreshToken(user);

      // rotate baseline
      user.refreshTokenHash = await bcrypt.hash(refresh, 12);
      await user.save();

      setAccessCookie(res, access);
      setRefreshCookie(res, refresh);
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
      secret: JWT_SECRET,
      algorithms: [JWT_ALG],
      getToken: (req) => req.cookies?.access_token || null,
    }).unless({
      path: [
        '/api/refresh',
        '/api/login',
        '/api/register',
        '/api/log*',
        '/api/emails',
        '/api/email',
        '/api/translate-practice',
        '/api/full-translate-practice',
        '/api/saved-translation',
        '/api/translate',
        '/api/confirm-translation',
        /^\/api\/dash-data\/.*/,
      ],
    })
  );

  app.get('/api/me', async (req, res) => {
    const user = await User.findById(req.auth.sub).select('_id email');
    res.json({ user });
  });

  // ---- Refresh endpoint (token rotation) ----
  app.post('/api/refresh', async (req, res) => {
    try {
      const refreshCookie = req.cookies?.refresh_token;
      if (!refreshCookie) return res.status(401).json({ error: 'Missing refresh token' });

      let payload;
      try {
        payload = jwt.verify(refreshCookie, REFRESH_SECRET, { algorithms: [JWT_ALG] });
      } catch {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      const user = await User.findById(payload.sub);
      if (!user || !user.refreshTokenHash) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      // Check presented refresh token matches the stored hash
      const match = await bcrypt.compare(refreshCookie, user.refreshTokenHash);
      if (!match) {
        // Possible reuse or a stale token: revoke by clearing stored hash
        user.refreshTokenHash = null;
        await user.save();
        clearAuthCookies(res);
        return res.status(401).json({ error: 'Refresh token mismatch' });
      }

      // Rotate: issue new refresh & access; replace stored hash
      const newAccess = signAccessToken(user);
      const newRefresh = signRefreshToken(user);
      user.refreshTokenHash = await bcrypt.hash(newRefresh, 12);
      await user.save();

      setAccessCookie(res, newAccess);
      setRefreshCookie(res, newRefresh);
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // ---- Logout (revoke refresh, clear cookies) ----
  app.post('/api/logout', async (req, res) => {
    try {
      const auth = req.cookies?.refresh_token;
      if (auth) {
        // best-effort revoke
        const payload = (() => {
          try {
            return jwt.decode(auth);
          } catch {
            return null;
          }
        })();
        if (payload?.sub) {
          await User.findByIdAndUpdate(payload.sub, { $set: { refreshTokenHash: null } });
        }
      }
    } finally {
      clearAuthCookies(res);
      res.json({ ok: true });
    }
  });

  // ---- Auth error handler for express-jwt ----
  app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({ error: 'Invalid or missing access token' });
    }
    next(err);
  });
};
