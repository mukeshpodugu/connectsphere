import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  reportedBy: mongoose.Types.ObjectId;
  reportedUserId: mongoose.Types.ObjectId;
  messageId?: mongoose.Types.ObjectId;
  reason: string;
  status: 'pending' | 'resolved';
  createdAt: Date;
}

const ReportSchema = new Schema<IReport>({
  reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reportedUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  messageId: { type: Schema.Types.ObjectId, ref: 'Message' },
  reason: { type: String, required: true, trim: true },
  status: { type: String, enum: ['pending', 'resolved'], default: 'pending' }
}, {
  timestamps: { createdAt: true, updatedAt: true }
});

export default mongoose.model<IReport>('Report', ReportSchema);
