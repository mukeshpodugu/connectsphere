import mongoose, { Schema, Document } from 'mongoose';

export interface IFile extends Document {
  name: string;
  url: string;
  path: string; // disk path or Cloudinary asset public ID
  size: number; // in bytes
  type: string; // mime-type
  uploader: mongoose.Types.ObjectId;
  chatId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const FileSchema = new Schema<IFile>({
  name: { type: String, required: true },
  url: { type: String, required: true },
  path: { type: String, required: true },
  size: { type: Number, required: true },
  type: { type: String, required: true },
  uploader: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true, index: true }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export default mongoose.model<IFile>('File', FileSchema);
