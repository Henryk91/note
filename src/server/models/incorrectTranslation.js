const mongoose = require('mongoose');

const IncorrectTranslationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    exerciseId: { type: String, required: true, index: true },
    sentence: { type: String, required: true, index: true},
    userInput: { type: String, required: true},
    translation: { type: String, required: true},
    corrected: { type: Boolean, default: false},
    attempts: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true }
);

IncorrectTranslationSchema.index({ userId: 1, exerciseId: 1, sentence: 1 }, { unique: true });

module.exports = mongoose.model('IncorrectTranslation', IncorrectTranslationSchema);
