import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:3000',
  'http://localhost:4000',
  'https://lingodrill.com',
  'https://www.lingodrill.com',
  'https://practice.lingodrill.com',
  'http://lingodrill.com',
  'http://www.lingodrill.com',
  'http://practice.lingodrill.com',
  'http://api.lingodrill.com',
  'https://api.lingodrill.com',
  'https://german.lingodrill.com',
  'https://bpmn-collaborator.onrender.com',
];

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  JWT_SECRET: z.string().min(10, 'JWT_SECRET must be set'),
  REFRESH_SECRET: z.string().min(10, 'REFRESH_SECRET must be set'),
  ACCESS_EXPIRES: z.string().default('15m'),
  REFRESH_EXPIRES: z.string().default('30d'),
  MAX_SESSIONS: z.coerce.number().int().positive().default(3),
  ALLOWED_ORIGINS: z.string().optional(),
  COOKIE_SECURE: z.string().optional(),
  DB: z.string().optional(),
  MONGODB_URI: z.string().optional(),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration');
  console.error(parsed.error.format());
  throw new Error('Invalid environment variables');
}

const allowedOrigins =
  parsed.data.ALLOWED_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? DEFAULT_ALLOWED_ORIGINS;

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
  mongoUri: parsed.data.MONGODB_URI || parsed.data.DB,
  jwt: {
    secret: parsed.data.JWT_SECRET,
    refreshSecret: parsed.data.REFRESH_SECRET,
    accessExpiresIn: parsed.data.ACCESS_EXPIRES,
    refreshExpiresIn: parsed.data.REFRESH_EXPIRES,
    maxSessions: parsed.data.MAX_SESSIONS,
  },
  allowedOrigins,
  secureCookies,
};

export type AppConfig = typeof config;
export default config;
