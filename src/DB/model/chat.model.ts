import mongoose, { Schema } from "mongoose";
import { Types } from "mongoose";
export interface IMessage {
  content: string;
  createdBy: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IChat {
  // OVO -> one vs one
  participants: Types.ObjectId[];
  createdBy: Types.ObjectId;
  messages: IMessage[];
  //   OVM -> one vs many
  group?: string;
  groupImage?: string;
  roomId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    content: { type: String, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const chatSchema = new Schema<IChat>(
  {
    participants: [
      { type: mongoose.Types.ObjectId, ref: "User", required: true },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    messages: [messageSchema],
    group: { type: String },
    groupImage: { type: String },
    roomId: { type: String },
  },
  { timestamps: true }
);

export const chatModel =
  mongoose.models.Chat || mongoose.model<IChat>("Chat", chatSchema);
// export const messageModel =
//   mongoose.models.Message || mongoose.model<IMessage>("Message", messageSchema);
