import mongoose, { Schema, type Document } from 'mongoose';

export type MessageType = 'text' | 'image' | 'disappearing';

export interface IMessage extends Document {
  matchId: string;
  senderId: string;
  content: string | null;
  type: MessageType;
  mediaUrl: string | null;
  disappearingMediaId: string | null;
  readAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    matchId: { type: String, required: true },
    senderId: { type: String, required: true },
    content: { type: String, default: null },
    type: { type: String, enum: ['text', 'image', 'disappearing'], default: 'text' },
    mediaUrl: { type: String, default: null },
    disappearingMediaId: { type: String, default: null },
    readAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

MessageSchema.index({ matchId: 1, createdAt: -1 });

export const Message =
  (mongoose.models['Message'] as mongoose.Model<IMessage> | undefined) ??
  mongoose.model<IMessage>('Message', MessageSchema);
