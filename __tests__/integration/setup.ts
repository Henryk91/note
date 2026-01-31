import mongoose from 'mongoose';
import supertest from 'supertest';
import mock from 'mock-require';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer | null = null;
let agent: ReturnType<typeof supertest.agent> | null = null;
let mongoUri: string = '';

const fetchCalls: any[] = [];
const googleMockResponse = '[[null,null,"[[\\"Hallo Welt\\"]]",null,null]]';

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

const ensureEnv = () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-for-testing';
  process.env.REFRESH_SECRET = process.env.REFRESH_SECRET || 'super-secret-refresh-key-for-testing';
  process.env.NODE_ENV = 'test';
  process.env.COOKIE_SECURE = 'false';
  process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'fake';
  process.env.WEATHER_DATA_API_KEY = process.env.WEATHER_DATA_API_KEY || 'fake';
  process.env.ADMIN_USER_ID = process.env.ADMIN_USER_ID || 'UUvFcBXO6Q';
  process.env.GOOGLE_TRANSLATE_TOKEN = process.env.GOOGLE_TRANSLATE_TOKEN || 'fake-token';
};

// Set environment before any modules are loaded
ensureEnv();

before(async () => {
  mongoUri = await buildMongoUri(); // Assign to the higher-scoped mongoUri
  process.env.DB = mongoUri; // Set DB env var here

  applyModuleMocks();

  await mongoose.connect(mongoUri);
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
    const NoteModel = require('../../backend/src/server/models/Notes').NoteModel;
    const NoteV2Model = require('../../backend/src/server/models/Notes').NoteV2Model;
    const TranslationScore = require('../../backend/src/server/models/TranslationScore').default;
    const IncorrectTranslation = require('../../backend/src/server/models/incorrectTranslation').default;

    await Promise.all([
      NoteModel.deleteMany({}),
      NoteV2Model.deleteMany({}),
      TranslationScore.deleteMany({}),
      IncorrectTranslation.deleteMany({}),
    ]);
  }
};

export const getFetchCalls = () => fetchCalls;
