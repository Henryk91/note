import { NoteRepository, noteRepository } from '../repositories/NoteRepository';
import { TranslationRepository, translationRepository } from '../repositories/TranslationRepository';
import { NoteDataLabel, IncorrectTranslationAttrs } from '../types/models';
import { OpenAIClient, getOpenAIClient } from '../clients/OpenAIClient';
import config from '../config';
import { TranslationScoreAttrs } from '../models/TranslationScore';
import { GoogleTranslateClient, googleTranslateClient } from '../clients/GoogleTranslateClient';
import { getVerifyTranslationPrompt } from '../prompts/translationPrompts';

interface TranslationPracticeMap {
  [key: string]: string;
}

interface NestedTranslationMap {
  [heading: string]: TranslationPracticeMap;
}

export class TranslationService {
  private repo: TranslationRepository;

  private noteRepo: NoteRepository;

  private googleClient: GoogleTranslateClient;

  private openAIClient: OpenAIClient;

  constructor(
    repo: TranslationRepository = translationRepository,
    noteRepo: NoteRepository = noteRepository,
    googleClient: GoogleTranslateClient = googleTranslateClient,
    openAIClient: OpenAIClient = getOpenAIClient(),
  ) {
    this.repo = repo;
    this.noteRepo = noteRepo;
    this.googleClient = googleClient;
    this.openAIClient = openAIClient;
  }

  async getTranslationPractice() {
    const docs = await this.noteRepo.findNotesByUserAndCreatedBy(config.adminUserId, 'Henry');
    const folderDoc = docs.find((d) => d.heading === config.translationPracticeFolderId);
    if (!folderDoc) return {};

    if (!docs || docs.length === 0) return {};

    const result = (docs[0].dataLable || []).reduce((acc: TranslationPracticeMap, { tag, data }: NoteDataLabel) => {
      const formatted = data.trim().endsWith('.') ? `${data} ` : `${data}. `;
      if (tag) {
        acc[tag] = acc[tag] ? `${acc[tag]}${formatted}` : formatted;
      }
      return acc;
    }, {});
    return result;
  }

  async getTranslationLevels() {
    const { translationPracticeFolderId, adminUserId } = config;

    const results = await this.noteRepo.getTranslationLevelsAggregate(adminUserId, translationPracticeFolderId);

    const map: Record<string, string[]> = {};
    results.forEach((res) => {
      map[res.name ?? ''] = (res.children || []).map((c: { name?: string }) => c.name || '');
    });
    return map;
  }

  async getFullTranslationPractice() {
    const docs = await this.noteRepo.findTranslationPracticeNotes(config.translationPracticeFolderId);

    const result = docs.reduce((acc: NestedTranslationMap, { heading, dataLable }) => {
      const nested = (dataLable || []).reduce((noteAcc: TranslationPracticeMap, { tag, data }: NoteDataLabel) => {
        const formatted = data.trim().endsWith('.') ? `${data} ` : `${data}. `;
        if (tag) {
          noteAcc[tag] = noteAcc[tag] ? `${noteAcc[tag]}${formatted}` : formatted;
        }
        return noteAcc;
      }, {});

      acc[heading] = nested;
      return acc;
    }, {});
    return result;
  }

  private splitSentences(input: string) {
    return input
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async getSavedTranslation(level: string, subLevel: string) {
    const userId = config.adminUserId;
    const levelDoc = await this.noteRepo.findNoteV2ByNameAndParent(userId, config.translationPracticeFolderId, level);
    if (!levelDoc) return null;

    const subLevelDoc = await this.noteRepo.findNoteV2ByNameAndParent(userId, levelDoc.id, subLevel);
    if (!subLevelDoc) return null;

    const docs = await this.noteRepo.findNotesV2ByParentId(userId, subLevelDoc.id);
    const noteDocs = docs.filter((d) => d.type === 'NOTE');

    const english = this.splitSentences(noteDocs[0]?.content?.data ?? '');
    const german = noteDocs.length > 1 ? this.splitSentences(noteDocs[1]?.content?.data ?? '') : [];

    const englishSentences = english.map((sentence, index) => ({
      sentence,
      translation: german[index] || '',
    }));
    return englishSentences;
  }

  async translateText(sentence: string) {
    return this.googleClient.translateText(sentence);
  }

  async verifyTranslation(english: string, german: string) {
    const prompt = getVerifyTranslationPrompt(english, german);

    const response = await this.openAIClient.createChatCompletion({
      model: config.openAI.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: config.openAI.temperature,
      max_tokens: config.openAI.maxTokens,
    });

    const answer = response.choices[0]?.message?.content?.trim().toLowerCase();
    return answer === 'true';
  }

  async getScores(userId: string) {
    return this.repo.findScoresByUserId(userId);
  }

  async updateScore(userId: string, data: Partial<TranslationScoreAttrs>) {
    const { exerciseId, score, attempts } = data;
    if (!exerciseId || typeof score !== 'number') {
      throw new Error('exerciseId and numeric score are required');
    }
    if (score < 0 || score > 100) {
      throw new Error('score must be between 0 and 100');
    }

    const update: Partial<TranslationScoreAttrs> = { score };
    if (typeof attempts === 'number' && attempts >= 1) {
      update.attempts = attempts;
    }

    return this.repo.upsertScore(userId, exerciseId, update);
  }

  async getIncorrectTranslations(userId: string, corrected?: boolean) {
    return this.repo.findIncorrectByUserId(userId, corrected);
  }

  async saveIncorrectTranslations(userId: string, raw: Omit<IncorrectTranslationAttrs, 'userId'>[]) {
    if (!Array.isArray(raw) || raw.length === 0) {
      throw new Error('Expected a non-empty array');
    }

    const ops = raw.map((it) => {
      const { exerciseId, sentence, userInput, translation, corrected } = it;
      if (!exerciseId || !sentence || !userInput || !translation) {
        throw new Error('Missing required fields in item');
      }
      return {
        updateOne: {
          filter: { userId, exerciseId, sentence },
          update: {
            $set: {
              userInput,
              translation,
              ...(typeof corrected === 'boolean' ? { corrected } : {}),
            },
            $setOnInsert: { userId, exerciseId, sentence },
            $inc: { attempts: 1 },
          },
          upsert: true,
          setDefaultsOnInsert: true,
        },
      };
    });

    await this.repo.bulkUpsertIncorrect(ops);
    return true;
  }
}

export const translationService = new TranslationService();
