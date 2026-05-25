import mongoose, { Schema, type Document } from 'mongoose';

export interface IDisappearingMedia extends Document {
  matchId: string;
  senderId: string;
  receiverId: string;
  s3Key: string;
  viewedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DisappearingMediaSchema = new Schema<IDisappearingMedia>(
  {
    matchId: { type: String, required: true },
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    s3Key: { type: String, required: true },
    viewedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

export const DisappearingMedia =
  (mongoose.models['DisappearingMedia'] as mongoose.Model<IDisappearingMedia> | undefined) ??
  mongoose.model<IDisappearingMedia>('DisappearingMedia', DisappearingMediaSchema);
