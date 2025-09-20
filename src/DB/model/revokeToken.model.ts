import mongoose, { Types } from "mongoose";

export interface IRevoke {
  userId: Types.ObjectId;
  tokenId: string;
  expiresAt: Date;
}

const revokeSchema = new mongoose.Schema<IRevoke>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  tokenId: {
    type: String,
    required: true,
  },
  expiresAt: { type: Date, required: true },
});

const revokeTokenModel =
  mongoose.models.RevokeToken || mongoose.model<IRevoke>("RevokeToken", revokeSchema);
export default revokeTokenModel;
