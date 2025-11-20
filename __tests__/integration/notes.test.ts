import { expect } from 'chai';
import mongoose from 'mongoose';
import { getAgent, registerAndLogin, resetDatabase } from './setup';

let agent: ReturnType<typeof getAgent>;

before(() => {
  agent = getAgent();
});

beforeEach(async () => {
  await resetDatabase();
  await registerAndLogin();
});

describe('Note v1 endpoints', () => {
  it('creates, fetches and updates notes', async () => {
    const saveRes = await agent.post('/api/save').send({
      id: 'note-1',
      createdBy: 'Tester',
      heading: 'First',
      dataLable: [{ tag: 'intro', data: 'Hello' }],
    });
    expect(saveRes.status).to.equal(200);
    expect(saveRes.body.Ok).to.equal('Created');

    const all = await agent.get('/api/note').query({ user: 'Tester' });
    expect(all.status).to.equal(200);
    expect(all.body[0].heading).to.equal('First');

    const single = await agent.get('/api/note').query({ user: 'Tester', noteHeading: 'note-1' });
    expect(single.status).to.equal(200);
    expect(single.body[0].id).to.equal('note-1');

    const names = await agent.get('/api/note-names');
    expect(names.status).to.equal(200);
    expect(names.body).to.include('Tester');

    const updateOne = await agent.post('/api/update-one').send({
      person: { id: 'note-1', heading: 'Updated', dataLable: [{ tag: 'intro', data: 'Updated' }] },
    });
    expect(updateOne.status).to.equal(200);
    expect(updateOne.body.Ok).to.equal('success');
  });
});

describe('Note v2 endpoints', () => {
  it('supports CRUD operations', async () => {
    const create = await agent.post('/api/note-v2').send({
      id: 'root::note',
      parentId: 'root',
      type: 'NOTE',
      content: { data: 'hello' },
    });
    expect(create.status).to.equal(200);
    expect(create.body.id).to.equal('root::note');

    const list = await agent.get('/api/note-v2').query({ parentId: 'root' });
    expect(list.status).to.equal(200);
    expect(list.body.length).to.equal(1);

    const update = await agent.put('/api/note-v2').send({
      id: 'root::note',
      parentId: 'root',
      type: 'NOTE',
      name: 'Renamed',
      content: { data: 'updated' },
    });
    expect(update.status).to.equal(200);
    expect(update.body.name).to.equal('Renamed');

    const del = await agent.delete('/api/note-v2').send({ id: 'root::note', parentId: 'root' });
    expect(del.status).to.equal(200);
    expect(Boolean(del.body.deletedCount ?? del.body.ok)).to.be.true;
  });
});

describe('Logging endpoint', () => {
  it('records log pings', async () => {
    const res = await agent.get('/api/log/ping');
    expect(res.status).to.equal(200);
    expect(res.body.Ok).to.exist;
  });
});
