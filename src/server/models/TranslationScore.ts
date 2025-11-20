import mongoose, { Document, Model } from 'mongoose';

export interface TranslationScoreAttrs {
  userId: string;
  exerciseId: string;
  score: number;
  attempts?: number;
}

export interface TranslationScoreDoc extends TranslationScoreAttrs, Document {
  createdAt: Date;
  updatedAt: Date;
}

const TranslationScoreSchema = new mongoose.Schema<TranslationScoreDoc>(
  {
    userId: { type: String, required: true, index: true },
    exerciseId: { type: String, required: true, index: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    attempts: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true }
);

TranslationScoreSchema.index({ userId: 1, exerciseId: 1 }, { unique: true });

const TranslationScore: Model<TranslationScoreDoc> = mongoose.model<TranslationScoreDoc>(
  'TranslationScore',
  TranslationScoreSchema
);

export default TranslationScore;
