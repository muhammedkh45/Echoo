import mongoose, { Schema, Types } from "mongoose";
export enum AllowCommentEnum {
  allow = "allow",
  disallow = "disallow",
}
export enum AvailabilityEnum {
  public = "public",
  private = "private",
  friends = "friends",
}
export interface IPost {
  content?: string;
  attachments?: string[];
  assetFolderId?: string;
  createdBy: Types.ObjectId;
  tags: Types.ObjectId[];
  likes: Types.ObjectId[];
  allowComment: AllowCommentEnum;
  availability: AvailabilityEnum;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  restoredAt?: Date;
  restoredBy?: Types.ObjectId;
}

export const postSchema = new Schema<IPost>(
  {
    content: {
      types: String,
      minlength: 5,
      maxlength: 2000,
      required: function () {
        return this.attachments?.length === 0;
      },
    },
    attachments: { type: [String] },
    assetFolderId: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tags: [{ type: Schema.Types.ObjectId, ref: "User" }],
    likes: [{ type: [Schema.Types.ObjectId], ref: "User" }],
    allowComment: {
      type: String,
      enum: AllowCommentEnum,
      default: AllowCommentEnum.allow,
    },
    availability: {
      type: String,
      enum: AvailabilityEnum,
      default: AvailabilityEnum.public,
    },
    deletedAt: { types: Date },
    deletedBy: { types: Types.ObjectId, ref: "User" },
    restoredAt: { types: Date },
    restoredBy: { types: Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
    strictQuery: true,
  }
);

postSchema.pre(["findOne", "find"], function (next) {
  const query = this.getQuery();
  const { paranoid, ...rest } = query;
  if (paranoid === false) {
    this.setQuery({ ...rest });
  } else {
    this.setQuery({ ...rest, deletedAt: { $exists: false } });
  }
  next();
});
postSchema.virtual("comments",{
  ref:"Comment",
  localField:"_id",
  foreignField:"postId"
})
const postModel = mongoose.models.Post || mongoose.model("Post", postSchema);
export default postModel;
