import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
  type: 'direct' | 'group';
  participants: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>({
  type: { type: String, enum: ['direct', 'group'], required: true },
  participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
  isArchived: { type: Boolean, default: false }
}, {
  timestamps: true
});

export default mongoose.model<IChat>('Chat', ChatSchema);
