import { expect } from 'chai';
import { getAgent, registerAndLogin, resetDatabase } from './setup';

// Search limited to the open notebook (`notebook` query parameter); without it, all notebooks.
let agent: ReturnType<typeof getAgent>;
before(() => {
  agent = getAgent();
});
beforeEach(async () => {
  await resetDatabase();
  await registerAndLogin();
});

const create = (body: Record<string, unknown>) => agent.post('/api/note-v2').send(body);

describe('Search scoped to a notebook', () => {
  it('returns only hits whose tree root is the given notebook, nested ones included', async () => {
    await require('../../backend/src/server/models/Notes').NoteV2Model.init();
    await create({ id: 'Henry::FOLDER::A', parentId: 'Henry', type: 'FOLDER', name: 'A' });
    await create({ id: 'Henry::FOLDER::A::FOLDER::B', parentId: 'Henry::FOLDER::A', type: 'FOLDER', name: 'B' });
    await create({ id: 'Henry::FOLDER::A::FOLDER::B::NOTE::1', parentId: 'Henry::FOLDER::A::FOLDER::B', type: 'NOTE', content: { data: 'zebra deep' } });
    await create({ id: 'Henry::NOTE::2', parentId: 'Henry', type: 'NOTE', content: { data: 'zebra top' } });
    await create({ id: 'Koorvi::NOTE::1', parentId: 'Koorvi', type: 'NOTE', content: { data: 'zebra other' } });

    const all = await agent.get('/api/search').query({ q: 'zebra' });
    expect(all.status).to.equal(200);
    expect(all.body.map((h: any) => h.id).sort()).to.deep.equal(['Henry::FOLDER::A::FOLDER::B::NOTE::1', 'Henry::NOTE::2', 'Koorvi::NOTE::1']);

    const henry = await agent.get('/api/search').query({ q: 'zebra', notebook: 'Henry' });
    expect(henry.status).to.equal(200);
    expect(henry.body.map((h: any) => h.id).sort()).to.deep.equal(['Henry::FOLDER::A::FOLDER::B::NOTE::1', 'Henry::NOTE::2']);
    expect(henry.body.find((h: any) => h.id === 'Henry::FOLDER::A::FOLDER::B::NOTE::1').label).to.equal('Henry / A / B');

    const koorvi = await agent.get('/api/search').query({ q: 'zebra', notebook: 'Koorvi', limit: 1 });
    expect(koorvi.body.map((h: any) => h.id)).to.deep.equal(['Koorvi::NOTE::1']);

    const none = await agent.get('/api/search').query({ q: 'zebra', notebook: 'Nope' });
    expect(none.body).to.have.length(0);
  });
});
