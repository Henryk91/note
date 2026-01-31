import mongoose, { Document, Model } from 'mongoose';

export interface RefreshSession {
  sid: string;
  tokenHash: string;
  userAgent?: string;
  ip?: string;
  lastUsedAt?: Date;
}

export interface UserAttrs {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  refreshSessions?: RefreshSession[];
  refreshTokenHash?: string;
}

export interface UserDoc extends UserAttrs, Document {
  createdAt: Date;
  updatedAt: Date;
}

const refreshSessionSchema = new mongoose.Schema<RefreshSession>({
  sid: { type: String, required: true },
  tokenHash: { type: String, required: true },
  userAgent: String,
  ip: String,
  lastUsedAt: Date,
});

const userSchema = new mongoose.Schema<UserDoc>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    refreshSessions: { type: [refreshSessionSchema], default: [] },
    refreshTokenHash: { type: String },
  },
  { timestamps: true },
);

const User: Model<UserDoc> = mongoose.model<UserDoc>('User', userSchema);

export default User;
