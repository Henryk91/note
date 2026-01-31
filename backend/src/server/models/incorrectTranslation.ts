import mongoose, { Document, Model } from 'mongoose';

export interface IncorrectTranslationAttrs {
  userId: string;
  exerciseId: string;
  sentence: string;
  userInput: string;
  translation: string;
  corrected?: boolean;
  attempts?: number;
}

export interface IncorrectTranslationDoc extends IncorrectTranslationAttrs, Document {
  createdAt: Date;
  updatedAt: Date;
}

const IncorrectTranslationSchema = new mongoose.Schema<IncorrectTranslationDoc>(
  {
    userId: { type: String, required: true, index: true },
    exerciseId: { type: String, required: true, index: true },
    sentence: { type: String, required: true, index: true },
    userInput: { type: String, required: true },
    translation: { type: String, required: true },
    corrected: { type: Boolean, default: false },
    attempts: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true },
);

IncorrectTranslationSchema.index({ userId: 1, exerciseId: 1, sentence: 1 }, { unique: true });

const IncorrectTranslation: Model<IncorrectTranslationDoc> = mongoose.model<IncorrectTranslationDoc>(
  'IncorrectTranslation',
  IncorrectTranslationSchema,
  'incorrect-translations',
);

export default IncorrectTranslation;
