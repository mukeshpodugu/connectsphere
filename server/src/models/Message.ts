import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string; // Encrypted text
  messageType: 'text' | 'file';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  status: 'sent' | 'delivered' | 'read';
  readBy: mongoose.Types.ObjectId[];
  deliveredTo: mongoose.Types.ObjectId[];
  isEdited: boolean;
  isPinned: boolean;
  isStarredBy: mongoose.Types.ObjectId[];
  parentMessage?: mongoose.Types.ObjectId;
  iv?: string; // IV for decrypting client-side
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  content: { type: String, required: true },
  messageType: { type: String, enum: ['text', 'file'], default: 'text' },
  fileUrl: { type: String },
  fileName: { type: String },
  fileSize: { type: Number },
  fileType: { type: String },
  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  deliveredTo: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  isEdited: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  isStarredBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  parentMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
  iv: { type: String } // Initialization vector for client decryption
}, {
  timestamps: true
});

// Create index for searching messages inside a chat
MessageSchema.index({ chatId: 1, createdAt: -1 });

export default mongoose.model<IMessage>('Message', MessageSchema);
