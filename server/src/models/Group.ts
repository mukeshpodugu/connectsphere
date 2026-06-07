import mongoose, { Schema, Document } from 'mongoose';

export interface IGroupMember {
  userId: mongoose.Types.ObjectId;
  role: 'admin' | 'member';
  joinedAt: Date;
}

export interface IGroup extends Document {
  chatId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  avatarUrl?: string;
  adminId: mongoose.Types.ObjectId;
  members: IGroupMember[];
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>({
  chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

export default mongoose.model<IGroup>('Group', GroupSchema);
