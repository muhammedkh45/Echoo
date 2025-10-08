import mongoose, { Types, Schema } from "mongoose";

export enum FriendRequestEnum {
  pending = "pending",
  accepted = "accepted",
  declined = "declined",
}
export interface IFriendRequest {
  createdBy: Types.ObjectId;
  sendTo: Types.ObjectId;
  acceptedAt?: Date;
  status?: FriendRequestEnum;
}

const friendRequestSchema = new mongoose.Schema<IFriendRequest>(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sendTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
    acceptedAt: { type: Date },
    status: { type: String, enum: FriendRequestEnum },
  },
  {
    timestamps: true,
    strictQuery: true,
  }
);

friendRequestSchema.pre(
  ["find", "findOne", "findOneAndUpdate"],
  function (next) {
    const query = this.getQuery();
    const { paranoid, ...rest } = query;
    if (paranoid === false) {
      this.setQuery({ ...rest });
    } else {
      this.setQuery({ ...rest, deletedAt: { $exists: false } });
    }
    next();
  }
);

const friendRequestModel =
  mongoose.models.FriendRequest ||
  mongoose.model<IFriendRequest>("FriendRequest", friendRequestSchema);
export default friendRequestModel;
