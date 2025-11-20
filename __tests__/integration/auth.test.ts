import { expect } from 'chai';
import request from 'supertest';
import { getAgent, registerAndLogin, resetDatabase } from './setup';

let agent: ReturnType<typeof getAgent>;

before(() => {
  agent = getAgent();
});

beforeEach(async () => {
  await resetDatabase();
  await registerAndLogin();
});

describe('Auth endpoints', () => {
  it('registers, logs in and returns /api/me', async () => {
    const me = await agent.get('/api/me');
    expect(me.status).to.equal(200);
    expect(me.body?.user?.email).to.equal('tester@example.com');
  });

  it('logs in an existing user', async () => {
    const login = await agent.post('/api/login').send({ email: 'tester@example.com', password: 'Password123!' });
    expect(login.status).to.equal(200);
    expect(login.body?.ok).to.equal(true);
    expect(login.headers['set-cookie']?.length || 0).to.be.greaterThan(0);
  });

  it('refreshes and logs out', async () => {
    const refresh = await agent.post('/api/refresh');
    expect(refresh.status).to.equal(200);
    expect(refresh.body?.ok).to.equal(true);

    const logout = await agent.post('/api/logout');
    expect(logout.status).to.equal(200);
    expect(logout.body?.ok).to.equal(true);
  });

  it('logs out all sessions', async () => {
    const logoutAll = await agent.post('/api/logout-all');
    expect(logoutAll.status).to.equal(200);
    expect(logoutAll.body?.ok).to.equal(true);
  });
});
