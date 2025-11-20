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

describe('Dashboard data proxy', () => {
  it('proxies weather, countries, historical and map data', async () => {
    const weather = await agent.get('/api/dash-data/weather').query({ coordinates: '0,0' });
    const countries = await agent.get('/api/dash-data/countries');
    const historical = await agent.get('/api/dash-data/historical');
    const mapData = await agent.get('/api/dash-data/map-data');

    expect(weather.status).to.equal(200);
    expect(weather.body.weather).to.equal('sunny');
    expect(countries.body[0].country).to.equal('ZA');
    expect(historical.body.cases.sample).to.equal(1);
    expect(mapData.body.ok).to.equal(true);
  });
});

describe('Email endpoints', () => {
  it('sends single and bulk emails with mock transporter', async () => {
    const email = await agent.post('/api/email').send({ text: 'Hi there', email: 'sender@test.com' });
    expect(email.status).to.equal(200);
    expect(email.body.Ok).to.equal('100');

    const bulkBody = { text: 'Hello', to: 'receiver@test.com', from: 'sender@test.com', subject: 'Hello' };
    const emails = await agent.post('/api/emails').send({ [JSON.stringify(bulkBody)]: '' });
    expect(emails.status).to.equal(200);
    expect(emails.body.Ok).to.equal('100');
  });
});

describe('Health and legacy auth', () => {
  it('returns health check', async () => {
    const res = await agent.get('/health');
    expect(res.status).to.equal(200);
    expect(res.body.ok).to.equal(true);
  });

  it('supports legacy register/login', async () => {
    const register = await agent.post('/api-old/register').send({
      email: 'legacy@test.com',
      firstName: 'Legacy',
      lastName: 'User',
      password: 'password',
      tempPass: ['temp'],
      permId: 'perm',
    });
    expect(register.status).to.equal(200);

    const login = await agent.post('/api-old/login').send({ email: 'legacy@test.com', password: 'password' });
    expect(login.status).to.equal(200);
    expect(login.body.id || login.body.status).to.exist;
  });
});
