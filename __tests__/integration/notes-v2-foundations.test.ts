import { expect } from 'chai';
import { getAgent, registerAndLogin, resetDatabase } from './setup';

let agent: ReturnType<typeof getAgent>;

before(() => {
  agent = getAgent();
});

beforeEach(async () => {
  await resetDatabase();
  await registerAndLogin();
});

const create = (body: Record<string, unknown>) => agent.post('/api/note-v2').send(body);

const seedTree = async () => {
  await create({ id: 'nb', parentId: 'nb', type: 'FOLDER', name: 'nb' }); // creates implicit root "nb"
  await create({ id: 'nb::f', parentId: 'nb', type: 'FOLDER', name: 'F' });
  await create({ id: 'nb::f::n1', parentId: 'nb::f', type: 'NOTE', content: { data: 'one' } });
  await create({ id: 'nb::f::sub', parentId: 'nb::f', type: 'FOLDER', name: 'Sub' });
  await create({ id: 'nb::f::sub::n2', parentId: 'nb::f::sub', type: 'NOTE', content: { data: 'two' } });
};

describe('Note v2 timestamps', () => {
  it('adds createdAt/updatedAt on create and bumps updatedAt on update', async () => {
    const res = await create({ id: 'r::a', parentId: 'r', type: 'NOTE', content: { data: 'x' } });
    expect(res.status).to.equal(200);
    expect(res.body.createdAt).to.be.a('string');
    expect(res.body.updatedAt).to.be.a('string');
    await new Promise((r) => setTimeout(r, 15));
    const upd = await agent.put('/api/note-v2').send({ id: 'r::a', content: { data: 'y' } });
    expect(upd.body.createdAt).to.equal(res.body.createdAt);
    expect(new Date(upd.body.updatedAt).getTime()).to.be.greaterThan(new Date(res.body.updatedAt).getTime());
  });
});

describe('Note v2 soft delete', () => {
  it('hides deleted items from every read and lists them under /deleted', async () => {
    await seedTree();
    const del = await agent.delete('/api/note-v2').send({ id: 'nb::f::n1', type: 'NOTE' });
    expect(del.status).to.equal(200);
    expect(del.body.deletedCount).to.equal(1);

    const list = await agent.get('/api/note-v2').query({ parentId: 'nb::f' });
    expect(list.body.map((n: any) => n.id)).to.not.include('nb::f::n1');
    const wc = await agent.get('/api/note-v2/with-children').query({ parentId: 'nb::f' });
    expect(wc.body['nb::f'].dataLable.map((n: any) => n.id)).to.not.include('nb::f::n1');

    const deleted = await agent.get('/api/note-v2/deleted').query({ notebook: 'nb' });
    expect(deleted.status).to.equal(200);
    expect(deleted.body.map((n: any) => n.id)).to.deep.equal(['nb::f::n1']);
    expect(deleted.body[0].deletedAt).to.be.a('string');
  });

  it('restores an item with PUT deletedAt: null', async () => {
    await seedTree();
    await agent.delete('/api/note-v2').send({ id: 'nb::f::n1', type: 'NOTE' });
    const res = await agent.put('/api/note-v2').send({ id: 'nb::f::n1', deletedAt: null });
    expect(res.status).to.equal(200);
    expect(res.body.deletedAt).to.not.exist;
    const list = await agent.get('/api/note-v2').query({ parentId: 'nb::f' });
    expect(list.body.map((n: any) => n.id)).to.include('nb::f::n1');
  });

  it('soft-deletes folder descendants together and restores them all', async () => {
    await seedTree();
    const del = await agent.delete('/api/note-v2').send({ id: 'nb::f', type: 'FOLDER' });
    expect(del.body.deletedCount).to.equal(4);

    for (const parentId of ['nb', 'nb::f', 'nb::f::sub']) {
      const list = await agent.get('/api/note-v2').query({ parentId });
      expect(list.body.map((n: any) => n.id), parentId).to.not.include.members(['nb::f']);
      expect(list.body.map((n: any) => n.id).filter((id: string) => id.startsWith('nb::f'))).to.have.length(0);
    }

    // Only the top of the deleted subtree is listed.
    const deleted = await agent.get('/api/note-v2/deleted').query({ notebook: 'nb' });
    expect(deleted.body.map((n: any) => n.id)).to.deep.equal(['nb::f']);

    await agent.put('/api/note-v2').send({ id: 'nb::f', deletedAt: null });
    const sub = await agent.get('/api/note-v2').query({ parentId: 'nb::f::sub' });
    expect(sub.body.map((n: any) => n.id)).to.deep.equal(['nb::f::sub::n2']);
    const f = await agent.get('/api/note-v2').query({ parentId: 'nb::f' });
    expect(f.body.map((n: any) => n.id)).to.have.members(['nb::f::n1', 'nb::f::sub']);
  });

  it('does not restore descendants that were deleted earlier on their own', async () => {
    await seedTree();
    await agent.delete('/api/note-v2').send({ id: 'nb::f::n1', type: 'NOTE' });
    await new Promise((r) => setTimeout(r, 10));
    await agent.delete('/api/note-v2').send({ id: 'nb::f', type: 'FOLDER' });
    await agent.put('/api/note-v2').send({ id: 'nb::f', deletedAt: null });
    const f = await agent.get('/api/note-v2').query({ parentId: 'nb::f' });
    expect(f.body.map((n: any) => n.id)).to.deep.equal(['nb::f::sub']);
  });

  it('treats a create with a soft-deleted id as a restore (Undo) and keeps date and text', async () => {
    const date = '2026-11-10T14:20:00+01:00';
    await create({ id: 'nb', parentId: 'nb', type: 'FOLDER', name: 'nb' });
    await create({ id: 'nb::Log', parentId: 'nb', type: 'FOLDER', name: 'Log' });
    await create({ id: 'nb::Log::LOG::1', parentId: 'nb::Log', type: 'LOG', content: { data: 'DEV-1 work', date } });
    await agent.delete('/api/note-v2').send({ id: 'nb::Log::LOG::1', type: 'LOG' });
    const again = await create({ id: 'nb::Log::LOG::1', parentId: 'nb::Log', type: 'LOG', content: { data: 'DEV-1 work', date } });
    expect(again.status).to.equal(200);
    expect(again.body.deletedAt).to.not.exist;
    expect(again.body.content.date).to.equal(date);
    const list = await agent.get('/api/note-v2').query({ parentId: 'nb::Log' });
    expect(list.body).to.have.length(1);
    expect(list.body[0].content.data).to.equal('DEV-1 work');
  });

  it('permanently deletes with permanent: true and empties Recently Deleted', async () => {
    await seedTree();
    await agent.delete('/api/note-v2').send({ id: 'nb::f::n1', type: 'NOTE' });
    await agent.delete('/api/note-v2').send({ id: 'nb::f::sub', type: 'FOLDER' });
    const empty = await agent.delete('/api/note-v2/deleted').query({ notebook: 'nb' });
    expect(empty.status).to.equal(200);
    expect(empty.body.deletedCount).to.equal(3);
    const deleted = await agent.get('/api/note-v2/deleted').query({ notebook: 'nb' });
    expect(deleted.body).to.have.length(0);

    const hard = await agent.delete('/api/note-v2').send({ id: 'nb::f', type: 'FOLDER', permanent: true });
    expect(hard.body.deletedCount).to.equal(1);
    const restore = await agent.put('/api/note-v2').send({ id: 'nb::f', deletedAt: null });
    expect(restore.status).to.be.greaterThan(399);
  });

  it('keeps deleted items of other users private', async () => {
    await seedTree();
    await agent.delete('/api/note-v2').send({ id: 'nb::f::n1', type: 'NOTE' });
    await agent.post('/api/register').send({ firstName: 'O', lastName: 'U', email: 'other@example.com', password: 'Password123!' });
    const login = await agent.post('/api/login').send({ email: 'other@example.com', password: 'Password123!' });
    expect(login.status).to.equal(200);
    const deleted = await agent.get('/api/note-v2/deleted');
    expect(deleted.status).to.equal(200);
    expect(deleted.body).to.have.length(0);
    const restore = await agent.put('/api/note-v2').send({ id: 'nb::f::n1', deletedAt: null });
    expect(restore.status).to.be.greaterThan(399);
  });
});

describe('Log settings', () => {
  it('round-trips settings on create and update', async () => {
    const settings = { mode: 'time-tracker', pinned: true, breakWords: ['break', 'lunch'], chips: ['Stop'] };
    const res = await create({ id: 'nb::T::Log', parentId: 'nb::T', type: 'FOLDER', name: 'Log', settings });
    expect(res.status).to.equal(200);
    expect(res.body.settings).to.deep.equal(settings);

    const upd = await agent.put('/api/note-v2').send({ id: 'nb::T::Log', settings: { mode: 'tally' } });
    expect(upd.status).to.equal(200);
    expect(upd.body.settings).to.deep.equal({ mode: 'tally' });

    const list = await agent.get('/api/note-v2').query({ parentId: 'nb::T' });
    expect(list.body[0].settings.mode).to.equal('tally');
  });

  it('rejects invalid settings', async () => {
    const bad = await create({ id: 'x::Log', parentId: 'x', type: 'FOLDER', name: 'Log', settings: { mode: 'nope' } });
    expect(bad.status).to.equal(400);
    const unknownKey = await agent.put('/api/note-v2').send({ id: 'x::Log', settings: { evil: 1 } });
    expect(unknownKey.status).to.equal(400);
    const badWords = await create({ id: 'y::Log', parentId: 'y', type: 'FOLDER', settings: { breakWords: [1] } });
    expect(badWords.status).to.equal(400);
  });
});

describe('SPA routing', () => {
  it('serves index.html for deep links instead of redirecting', async () => {
    for (const p of ['/f/abc', '/n/abc', '/notes/main']) {
      // eslint-disable-next-line no-await-in-loop
      const res = await agent.get(p).set('Cookie', '').redirects(0);
      expect(res.status, p).to.not.equal(302);
      expect(res.headers.location, p).to.not.exist;
    }
  });

  it('redirects / and /login to /notes/main only when logged in', async () => {
    const out = await require('supertest')(require('../../backend/src/server/index').default).get('/').redirects(0);
    expect(out.status).to.not.equal(302);
    const inn = await require('supertest')(require('../../backend/src/server/index').default)
      .get('/login')
      .set('Cookie', 'access_token=x')
      .redirects(0);
    expect(inn.status).to.equal(302);
    expect(inn.headers.location).to.equal('/notes/main');
  });
});
