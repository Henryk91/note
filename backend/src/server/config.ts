import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const DEFAULT_CORS_ALLOWED_ORIGINS = ['http://localhost:8080', 'http://localhost:3000'];
const DEFAULT_SITE_LOG_SKIP_REFERRER = ['localhost', '127.0.0.1'];
const DEFAULT_SITE_LOG_SKIP_IPS = ['127.0.0.1'];

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  JWT_SECRET: z.string().min(10, 'JWT_SECRET must be set'),
  REFRESH_SECRET: z.string().min(10, 'REFRESH_SECRET must be set'),
  ACCESS_EXPIRES: z.string().default('15m'),
  REFRESH_EXPIRES: z.string().default('30d'),
  MAX_SESSIONS: z.coerce.number().int().positive().default(3),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  COOKIE_SECURE: z.string().optional(),
  MONGODB_URI: z.string().optional(),
  SITE_LOG_SKIP_REFERERS: z.string().optional(),
  SITE_LOG_SKIP_IPS: z.string().optional(),
  ADMIN_USER_ID: z.string().optional(),
  GOOGLE_TRANSLATE_TOKEN: z.string().optional(),
  LOG_SITES_NOTE_ID: z.string().optional(),
  TRANSLATION_PRACTICE_FOLDER_ID: z.string().optional().default('TranslationPractice'),
  WEATHER_DATA_API_KEY: z.string().optional(),
  SMTP_USER_NAME: z.string().optional(),
  SMTP_EMAIL_PASSWORD: z.string().optional(),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration');
  console.error(parsed.error.format());
  throw new Error('Invalid environment variables');
}

const corsAllowOrigins =
  parsed.data.CORS_ALLOWED_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? DEFAULT_CORS_ALLOWED_ORIGINS;

const siteLogSkipReferrers =
  parsed.data.SITE_LOG_SKIP_REFERERS?.split(',')
    .map((entry) => entry.trim())
    .filter(Boolean) ?? DEFAULT_SITE_LOG_SKIP_REFERRER;

const siteLogSkipIp =
  parsed.data.SITE_LOG_SKIP_IPS?.split(',')
    .map((entry) => entry.trim())
    .filter(Boolean) ?? DEFAULT_SITE_LOG_SKIP_IPS;

const secureCookies =
  parsed.data.COOKIE_SECURE?.toLowerCase() === 'true'
    ? true
    : parsed.data.COOKIE_SECURE?.toLowerCase() === 'false'
      ? false
      : parsed.data.NODE_ENV === 'production';

const config = {
  env: parsed.data.NODE_ENV,
  isProd: parsed.data.NODE_ENV === 'production',
  port: parsed.data.PORT,
  mongoUri: parsed.data.MONGODB_URI,
  jwt: {
    secret: parsed.data.JWT_SECRET,
    refreshSecret: parsed.data.REFRESH_SECRET,
    accessExpiresIn: parsed.data.ACCESS_EXPIRES,
    refreshExpiresIn: parsed.data.REFRESH_EXPIRES,
    maxSessions: parsed.data.MAX_SESSIONS,
  },
  corsAllowOrigins,
  siteLogSkipReferrers,
  siteLogSkipIp,
  secureCookies,
  adminUserId: parsed.data.ADMIN_USER_ID,
  googleTranslateToken: parsed.data.GOOGLE_TRANSLATE_TOKEN,
  logSitesNoteId: parsed.data.LOG_SITES_NOTE_ID,
  translationPracticeFolderId: parsed.data.TRANSLATION_PRACTICE_FOLDER_ID,
  weatherApiKey: parsed.data.WEATHER_DATA_API_KEY,
  smtpUserName: parsed.data.SMTP_USER_NAME,
  smtpEmailPassword: parsed.data.SMTP_EMAIL_PASSWORD,
};

export type AppConfig = typeof config;
export default config;
