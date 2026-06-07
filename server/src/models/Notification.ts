import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  status: 'unread' | 'read';
  type: 'message' | 'mention' | 'group' | 'call';
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['unread', 'read'], default: 'unread', index: true },
  type: { type: String, enum: ['message', 'mention', 'group', 'call'], required: true },
  link: { type: String }
}, {
  timestamps: true
});

export default mongoose.model<INotification>('Notification', NotificationSchema);
