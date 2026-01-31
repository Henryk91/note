import { FilterQuery, AnyBulkWriteOperation } from 'mongoose';
import TranslationScore from '../models/TranslationScore';
import IncorrectTranslation from '../models/incorrectTranslation';
import { TranslationScoreAttrs, TranslationScoreDoc, IncorrectTranslationDoc } from '../types/models';

export class TranslationRepository {
  async findScoresByUserId(userId: string): Promise<TranslationScoreDoc[]> {
    return TranslationScore.find({ userId }).exec();
  }

  async upsertScore(
    userId: string,
    exerciseId: string,
    update: Partial<TranslationScoreAttrs>,
  ): Promise<TranslationScoreDoc | null> {
    return TranslationScore.findOneAndUpdate(
      { userId, exerciseId },
      { $set: update, $setOnInsert: { userId, exerciseId } },
      { new: true, upsert: true, runValidators: true },
    ).exec();
  }

  async findIncorrectByUserId(userId: string, corrected?: boolean): Promise<IncorrectTranslationDoc[]> {
    const filter: FilterQuery<IncorrectTranslationDoc> = { userId };
    if (corrected !== undefined) {
      filter.corrected = corrected;
    }
    return IncorrectTranslation.find(filter, {
      exerciseId: 1,
      sentence: 1,
      translation: 1,
      _id: 0,
    })
      .sort({ updatedAt: 1 })
      .exec();
  }

  async bulkUpsertIncorrect(ops: AnyBulkWriteOperation<IncorrectTranslationDoc>[]): Promise<unknown> {
    return IncorrectTranslation.bulkWrite(ops, { ordered: false });
  }
}

export const translationRepository = new TranslationRepository();
