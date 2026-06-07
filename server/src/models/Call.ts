import mongoose, { Schema, Document } from 'mongoose';

export interface ICall extends Document {
  callerId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  callType: 'audio' | 'video';
  status: 'ringing' | 'connected' | 'completed' | 'missed' | 'rejected' | 'failed';
  startTime?: Date;
  endTime?: Date;
  duration?: number; // duration in seconds
  createdAt: Date;
}

const CallSchema = new Schema<ICall>({
  callerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  callType: { type: String, enum: ['audio', 'video'], required: true },
  status: {
    type: String,
    enum: ['ringing', 'connected', 'completed', 'missed', 'rejected', 'failed'],
    default: 'ringing'
  },
  startTime: { type: Date },
  endTime: { type: Date },
  duration: { type: Number, default: 0 }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export default mongoose.model<ICall>('Call', CallSchema);
