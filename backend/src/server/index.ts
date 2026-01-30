import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import cors, { CorsOptions } from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import path from 'path';
import xss from 'xss';

import config from './config';
import jwtSetup from './jwt-setup';
import getNotes from './routes/getNotes';
import handleNotesV2 from './routes/handleNotesV2';
import getNoteNames from './routes/getNoteNames';
import updateNotes from './routes/updateNotes';
import getDashData from './routes/getDashData';
import sendEmail from './routes/sendEmail';
import translate from './routes/translate';
import translationScoresRouter from './routes/translationScores';
import incorrectTranslationsRoute from './routes/incorrectTranslations';

const projectRoot = path.resolve(__dirname, '../..');
const frontendDist = path.resolve(projectRoot, 'build', 'client');

export const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

const isHenrykSubdomain = (origin: string) => {
  try {
    const { protocol, hostname } = new URL(origin);
    if (protocol !== 'https:') return false;
    return hostname === 'henryk.co.za' || hostname.endsWith('.henryk.co.za');
  } catch (err) {
    console.log('Domain check error', err);
    return false;
  }
};

const corsOptions: CorsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (config.allowedOrigins.includes(origin) || isHenrykSubdomain(origin)) {
      return cb(null, origin);
    }
    return cb(new Error('CORS not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

app.use(
  helmet({
    // allow serving static assets and API from same domain
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com', 'https://fonts.googleapis.com'],
        fontSrc: [
          "'self'",
          'data:',
          'https://cdnjs.cloudflare.com',
          'https://fonts.gstatic.com',
          'https://db.onlinewebfonts.com',
        ],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: [
          "'self'",
          'https://cdnjs.cloudflare.com',
          'https://fonts.googleapis.com',
          'https://fonts.gstatic.com',
          'https://db.onlinewebfonts.com',
        ],
        imgSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
      },
    },
  }),
);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

const sanitizeValue = (value: unknown): unknown => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return xss(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value instanceof Date || value instanceof Buffer) return value;
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce(
      (acc, [key, entry]) => {
        acc[key] = sanitizeValue(entry);
        return acc;
      },
      {} as Record<string, unknown>,
    );
  }
  return value;
};

const sanitizeRequest = (req: Request, _res: Response, next: NextFunction) => {
  req.body = sanitizeValue(req.body);
  req.query = sanitizeValue(req.query) as Request['query'];
  req.params = sanitizeValue(req.params) as Request['params'];
  next();
};

app.use('/api', apiLimiter);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(hpp());
app.use(mongoSanitize({ allowDots: true }));
app.use(sanitizeRequest);
app.use(cookieParser());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

jwtSetup(app);

app.use(express.static(frontendDist));
app.use('/api/note', getNotes);
app.use('/api/note-v2', handleNotesV2);
app.use('/api/note-names', getNoteNames);
app.use('/api/translation-scores', translationScoresRouter);
app.use('/api/incorrect-translations', incorrectTranslationsRoute);

translate(app);
updateNotes(app);
getDashData(app);
sendEmail(app);

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, uptime: process.uptime() });
});

app.get('/sw.js', (_req, res) => {
  res.setHeader('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate');
  res.sendFile(path.join(frontendDist, 'sw.js'));
});

app.get(/^\/(?!api).*/, (req, res) => {
  // Always serve the SPA entry point; redirect once to a preferred path if needed.
  const targetPath = req?.cookies?.access_token ? '/notes/main' : '/';
  if (req.url !== targetPath) {
    return res.redirect(targetPath);
  }
  return res.sendFile(path.join(frontendDist, 'index.html'));
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(err.status ?? 500).json({
    error: 'Internal server error',
    message: config.isProd ? undefined : err.message,
  });
});

// Only start the HTTP server when running the real app, not during tests
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`Listening on port ${config.port}!`);
  });

  if (config.mongoUri) {
    mongoose
      .connect(config.mongoUri)
      .then(() => {
        console.log('Connected to MongoDB');
      })
      .catch((err) => {
        console.error('MongoDB connection error:', err);
      });
  } else {
    console.error('No MongoDB URI provided. Running without DB connection.');
  }
}

export default app;
