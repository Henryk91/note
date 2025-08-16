// models/TranslationScore.js
const mongoose = require('mongoose');

const TranslationScoreSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    exerciseId: { type: String, required: true, index: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    attempts: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true }
);

TranslationScoreSchema.index({ userId: 1, exerciseId: 1 }, { unique: true });

module.exports = mongoose.model('TranslationScore', TranslationScoreSchema);
