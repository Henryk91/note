import mongoose from 'mongoose';
import supertest from 'supertest';
import mock from 'mock-require';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer | null = null;
let agent: ReturnType<typeof supertest.agent> | null = null;

const fetchCalls: any[] = [];
const googleMockResponse = '[[[null,null,"[[\\"Hallo Welt\\"]]",null,null]]]';

const jsonResponse = (payload: any) => ({
  json: async () => payload,
  text: async () => (typeof payload === 'string' ? payload : JSON.stringify(payload)),
});

const fetchMock = async (url: any) => {
  fetchCalls.push(url);
  const target = typeof url === 'string' ? url : '';
  if (target.includes('translate.google')) {
    return jsonResponse(googleMockResponse);
  }
  if (target.includes('openai.com')) {
    return jsonResponse({ choices: [{ message: { content: 'true' } }] });
  }
  if (target.includes('darksky')) {
    return jsonResponse({ weather: 'sunny' });
  }
  if (target.includes('covid-19/countries')) {
    return jsonResponse([{ country: 'ZA' }]);
  }
  if (target.includes('historical/all')) {
    return jsonResponse({ cases: { sample: 1 } });
  }
  if (target.includes('timeline/map-data')) {
    return jsonResponse({ ok: true });
  }
  return jsonResponse({ ok: true });
};

const nodemailerMock = {
  createTransport: () => ({
    sendMail: (_message: any, cb: any) => (typeof cb === 'function' ? cb(null, { accepted: ['ok'] }) : undefined),
  }),
};

const applyModuleMocks = () => {
  mock.stopAll();
  mock('node-fetch', fetchMock);
  mock('nodemailer', nodemailerMock);
};

const buildMongoUri = async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: { ip: '127.0.0.1', port: 0 },
  });
  return mongoServer.getUri();
};

const ensureEnv = (mongoUri: string) => {
  process.env.NODE_ENV = 'test';
  process.env.DB = mongoUri;
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  process.env.REFRESH_SECRET = process.env.REFRESH_SECRET || 'refresh-secret';
  process.env.ACCESS_EXPIRES = process.env.ACCESS_EXPIRES || '15m';
  process.env.REFRESH_EXPIRES = process.env.REFRESH_EXPIRES || '30d';
  process.env.MAX_SESSIONS = process.env.MAX_SESSIONS || '3';
  process.env.CORS_ALLOWED_ORIGINS = process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000';
  process.env.COOKIE_SECURE = 'false';
  process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'fake';
  process.env.WEATHER_DATA_API_KEY = process.env.WEATHER_DATA_API_KEY || 'fake';
};

before(async () => {
  const uri = await buildMongoUri();
  ensureEnv(uri);
  applyModuleMocks();

  await mongoose.connect(uri);
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }

  // import app after env + mocks + db are ready
  const { default: app } = await import('../../backend/src/server/index');
  agent = supertest.agent(app as any);
});

beforeEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
  }
  fetchCalls.length = 0;
});

after(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
  mock.stopAll();
});

export const getAgent = (): ReturnType<typeof supertest.agent> => {
  if (!agent) throw new Error('Agent not initialized');
  return agent;
};

export const registerAndLogin = async (overrides = {}) => {
  const client = getAgent();
  const email = 'tester@example.com';
  const password = 'Password123!';
  const payload = { firstName: 'Test', lastName: 'User', email, password, ...overrides };

  const res = await client.post('/api/register').send(payload);
  const login = await client.post('/api/login').send({ email, password });
  return { res, login, email, password, id: res.body?.user?.id };
};

export const resetDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
  }
};

export const getFetchCalls = () => fetchCalls;
