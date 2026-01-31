import { expect } from 'chai';
import mongoose from 'mongoose';
import { getAgent, registerAndLogin, resetDatabase, getFetchCalls } from './setup';

let agent: ReturnType<typeof getAgent>;

before(() => {
  agent = getAgent();
});

beforeEach(async () => {
  await resetDatabase();
  await registerAndLogin();
});

const Note = () => mongoose.model('Notes');
const NoteV2 = () => mongoose.model('NoteV2');

describe('Translation practice endpoints', () => {
  it('serve practice, levels and saved content', async () => {
    await Note().create({
      id: 'practice-1',
      userId: 'UUvFcBXO6Q',
      createdBy: 'Henry',
      heading: 'TranslationPractice',
      dataLable: [
        { tag: 'A1', data: 'Hello world.' },
        { tag: 'A1', data: 'Another sentence' },
      ],
    });

    await NoteV2().create({
      id: 'level-1',
      userId: 'UUvFcBXO6Q',
      parentId: 'TranslationPractice',
      name: 'Level1',
      type: 'FOLDER',
    });

    await NoteV2().create({
      id: 'sub-level-1',
      userId: 'UUvFcBXO6Q',
      parentId: 'level-1',
      name: 'Intro',
      type: 'NOTE',
      content: { data: 'One. Two.' },
    });

    await NoteV2().create({
      id: 'saved-A1',
      userId: 'UUvFcBXO6Q',
      parentId: 'TranslationPractice',
      name: 'A1',
      type: 'FOLDER',
    });

    await NoteV2().create({
      id: 'saved-intro',
      userId: 'UUvFcBXO6Q',
      parentId: 'saved-A1',
      name: 'intro',
      type: 'NOTE',
    });

    await NoteV2().create({
      id: 'saved-content-1',
      userId: 'UUvFcBXO6Q',
      parentId: 'saved-intro',
      type: 'NOTE',
      content: { data: 'Sentence one. Sentence two.' },
    });

    await NoteV2().create({
      id: 'saved-content-2',
      userId: 'UUvFcBXO6Q',
      parentId: 'saved-intro',
      type: 'NOTE',
      content: { data: 'Satz eins. Satz zwei.' },
    });

    const practice = await agent.get('/api/translate-practice');
    expect(practice.status).to.equal(200);
    expect(practice.body.A1).to.contain('Hello world.');

    const levels = await agent.get('/api/translate-levels');
    expect(levels.status).to.equal(200);
    expect(Array.isArray(levels.body.Level1)).to.equal(true);

    const full = await agent.get('/api/full-translate-practice');
    expect(full.status).to.equal(200);
    expect(full.body.Level1.Intro).to.contain('One.');

    const saved = await agent.get('/api/saved-translation').query({ level: 'A1', subLevel: 'intro' });
    expect(saved.status).to.equal(200);
    expect(saved.body[0].translation).to.contain('Satz eins');
  });
});

describe('Translation scoring endpoints', () => {
  it('upserts and lists scores', async () => {
    const post = await agent.post('/api/translation-scores').send({ exerciseId: 'ex-1', score: 90 });
    expect(post.status).to.equal(200);
    expect(post.body.score).to.equal(90);

    const list = await agent.get('/api/translation-scores');
    expect(list.status).to.equal(200);
    expect(list.body[0].exerciseId).to.equal('ex-1');
  });
});

describe('Incorrect translations endpoints', () => {
  it('stores and retrieves items', async () => {
    const payload = [
      { exerciseId: 'ex-1', sentence: 'Hello', userInput: 'Hallo', translation: 'Hello' },
      { exerciseId: 'ex-2', sentence: 'Bye', userInput: 'Tschuss', translation: 'Bye', corrected: true },
    ];

    const save = await agent.post('/api/incorrect-translations').send(payload);
    expect(save.status).to.equal(200);
    expect(save.body.ok).to.equal(true);

    const list = await agent.get('/api/incorrect-translations');
    expect(list.status).to.equal(200);
    expect(list.body.items.length).to.equal(2);
  });
});

describe('Translation proxy endpoints', () => {
  it('proxies Google translate', async () => {
    const res = await agent.post('/api/translate').send({ sentence: 'Hello world' });
    expect(res.status).to.equal(200);
    expect(res.body.translated).to.equal('Hallo Welt');
  });

  it('checks translations via OpenAI', async () => {
    const res = await agent.post('/api/confirm-translation').send({ english: 'Hello', german: 'Hallo' });
    expect(res.status).to.equal(200);
    expect(res.body.isCorrect).to.equal(true);
  });
});
