import mongoose, { HydratedDocument, Schema, Types } from "mongoose";
import { IPost } from "./post.model";
export enum onModelEnum {
  Post = "Post",
  Comment = "Comment",
}
export interface IComment {
  content?: string;
  attachments?: string[];
  assetFolderId?: string;
  createdBy: Types.ObjectId;
  tags: Types.ObjectId[];
  likes: Types.ObjectId[];
  refId: Types.ObjectId;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  restoredAt?: Date;
  restoredBy?: Types.ObjectId;
  onModel:onModelEnum;
}

const commentSchema = new Schema<IComment>(
  {
    content: {
      types: String,
      minlength: 5,
      maxlength: 1000,
      required: function () {
        return this.attachments?.length === 0;
      },
    },
    attachments: { type: [String] },
    assetFolderId: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tags: [{ type: Schema.Types.ObjectId, ref: "User" }],
    likes: [{ type: [Schema.Types.ObjectId], ref: "User" }],
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    restoredAt: { type: Date },
    restoredBy: { type: Schema.Types.ObjectId, ref: "User" },
    refId: { type: Schema.Types.ObjectId, refPath: "onModel", required: true },
    onModel: { type: String, enum: onModelEnum, required: true },
  },
  {
    timestamps: true,
  }
);
commentSchema.pre(
  ["findOne", "find", "findOneAndDelete", "findOneAndUpdate"],
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

commentSchema.virtual("replies", {
  ref: "Comment",
  localField: "_id",
  foreignField: "commentId",
});
const commentModel =
  mongoose.models.Comment || mongoose.model("Comment", commentSchema);
export default commentModel;
