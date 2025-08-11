const mongoose = require('mongoose');

const refreshSessionSchema = new mongoose.Schema({
  sid: { type: String, required: true },
  tokenHash: { type: String, required: true },
  userAgent: String,
  ip: String,
  lastUsedAt: Date
});

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    // store the *current* hashed refresh token for rotation
    refreshSessions: { type: [refreshSessionSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);