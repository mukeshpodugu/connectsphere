import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  bio?: string;
  avatarUrl?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: Date;
  isAdmin: boolean;
  isVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  refreshTokens: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, trim: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true },
  bio: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  status: { type: String, enum: ['online', 'offline', 'away', 'busy'], default: 'offline' },
  lastSeen: { type: Date, default: Date.now },
  isAdmin: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
  refreshTokens: [{ type: String }]
}, {
  timestamps: true
});

// Hash password before saving if it has been modified
UserSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// Compare password helper
UserSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

export default mongoose.model<IUser>('User', UserSchema);
