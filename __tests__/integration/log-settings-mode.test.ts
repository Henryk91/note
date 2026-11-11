import { expect } from 'chai';
import { getAgent, registerAndLogin, resetDatabase } from './setup';

// ui-review N1: a log's `settings.mode` must never change unless a request explicitly sends new settings.
let agent: ReturnType<typeof getAgent>;
before(() => {
  agent = getAgent();
});
beforeEach(async () => {
  await resetDatabase();
  await registerAndLogin();
});

const LOG = 'Henry::FOLDER::Break::FOLDER::Break-P5::Log';
const folderDoc = async () => {
  const res = await agent.get('/api/note-v2/with-children').query({ parentId: 'Henry::FOLDER::Break::FOLDER::Break-P5' });
  const list = Object.values(res.body as Record<string, { dataLable: { id: string; settings?: unknown }[] }>)[0]?.dataLable ?? [];
  return list.find((d) => d.id === LOG);
};

describe('Log mode is only changed on purpose', () => {
  it('keeps the tally mode when entries are added, edited, deleted and the log is renamed or moved', async () => {
    await agent.post('/api/note-v2').send({ id: 'Henry::FOLDER::Break::FOLDER::Break-P5', parentId: 'Henry::FOLDER::Break', type: 'FOLDER', name: 'Break P5' });
    const created = await agent
      .post('/api/note-v2')
      .send({ id: LOG, parentId: 'Henry::FOLDER::Break::FOLDER::Break-P5', type: 'FOLDER', name: 'Log', settings: { mode: 'tally', pinned: true } });
    expect(created.status).to.equal(200);

    const entry = { id: `${LOG}::e1`, parentId: LOG, type: 'LOG', content: { data: 'P', date: '2026-11-10T09:00:00+01:00' } };
    expect((await agent.post('/api/note-v2').send(entry)).status).to.equal(200);
    expect((await agent.put('/api/note-v2').send({ id: entry.id, content: { data: 'P v2', date: entry.content.date } })).status).to.equal(200);
    expect((await agent.delete('/api/note-v2').send({ id: entry.id })).status).to.equal(200);
    expect((await agent.put('/api/note-v2').send({ id: LOG, name: 'Log' })).status).to.equal(200);
    expect((await agent.put('/api/note-v2').send({ id: LOG, parentId: 'Henry::FOLDER::Break::FOLDER::Break-P5' })).status).to.equal(200);

    const doc = await folderDoc();
    expect(doc?.settings).to.deep.equal({ mode: 'tally', pinned: true });
  });

  it('changes the mode only when settings are sent', async () => {
    await agent.post('/api/note-v2').send({ id: LOG, parentId: 'Henry::FOLDER::Break::FOLDER::Break-P5', type: 'FOLDER', name: 'Log', settings: { mode: 'tally' } });
    const upd = await agent.put('/api/note-v2').send({ id: LOG, settings: { mode: 'tally', pinned: true } });
    expect(upd.body.settings).to.deep.equal({ mode: 'tally', pinned: true });
  });
});
