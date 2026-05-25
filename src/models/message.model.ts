import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const messageSchema = new Schema(
  {
    matchId: { type: String, required: true, index: true },
    senderId: { type: String, required: true, index: true },
    content: { type: String, required: true, maxlength: 5000 },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

messageSchema.index({ matchId: 1, createdAt: -1 });
// TTL index: uncomment and adjust expireAfterSeconds to auto-delete old messages
// messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 });

export type MessageDocument = InferSchemaType<typeof messageSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Message =
  (mongoose.models.Message as mongoose.Model<MessageDocument>) ??
  mongoose.model<MessageDocument>('Message', messageSchema);
