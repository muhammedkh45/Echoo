import { NextFunction, Request, Response } from "express";
import { PostRepository } from "../../DB/repositories/post.repository";
import { UserRepository } from "../../DB/repositories/user.repository";
import userModel, { RoleType } from "../../DB/model/user.model";
import postModel, {
  AllowCommentEnum,
  AvailabilityEnum,
  IPost,
} from "../../DB/model/post.model";
import commentModel, {
  IComment,
  onModelEnum,
} from "../../DB/model/comment.model";
import { CommentRepository } from "../../DB/repositories/comment.repository";
import { AppError } from "../../utils/classError";
import {
  createCommentBodySchemaType,
  createCommentParamsSchemaType,
  freezeCommentSchemaType,
} from "./comment.validation";
import { deleteFiles, uploadFiles } from "../../utils/s3.config";
import { uuid } from "uuidv4";
import { populate } from "dotenv";
import { HydratedDocument, Types } from "mongoose";
import { eventEmitter } from "../../utils/Events/Email.event";

class CommentServices {
  private _postModel = new PostRepository(postModel);
  private _userModel = new UserRepository(userModel);
  private _commentModel = new CommentRepository(commentModel);
  constructor() {}

  createComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { postId, commentId }: createCommentParamsSchemaType = req.params;
      let { content, tags, attachments, onModel } = req.body;
      let doc: HydratedDocument<IPost | IComment> | null = null;
      if (commentId) {
        if (onModel !== onModelEnum.Comment) {
          throw new AppError("onModel must be comment", 400);
        }
        const comment = await this._commentModel.findOne(
          {
            _id: commentId,
            refId: postId,
          },
          undefined,
          {
            populate: {
              path: "refId",
              match: {
                allowComment: AllowCommentEnum.allow,
                $or: [
                  { availability: AvailabilityEnum.public },
                  {
                    availability: AvailabilityEnum.private,
                    createdBy: req.user?._id,
                  },
                  {
                    availability: AvailabilityEnum.friends,
                    createdBy: {
                      $in: [...(req.user?.friends || []), req.user?._id],
                    },
                  },
                ],
              },
            },
          }
        );
        if (!comment?.refId) {
          throw new AppError(
            "comment not found or you are not authorixed",
            404
          );
        }
        doc = comment;
      } else if (onModel == onModelEnum.Post) {
        const post = await this._postModel.findOne({
          _id: postId,
          allowComment: AllowCommentEnum.allow,
          $or: [
            { availability: AvailabilityEnum.public },
            {
              availability: AvailabilityEnum.private,
              createdBy: req.user?._id,
            },
            {
              availability: AvailabilityEnum.friends,
              createdBy: { $in: [...(req.user?.friends || []), req.user?._id] },
            },
          ],
        });
        if (!post) {
          throw new AppError(`post not found`, 404);
        }
        doc = post;
      }

      if (
        req.body.tags?.length &&
        (
          await this._userModel.find({
            filter: { _id: { $in: req.body.tags } },
          })
        ).length !== req.body.tags?.length
      ) {
        throw new AppError("InValid User ID ");
      }
      const assetFolderId = uuid();
      if (req.files?.length) {
        attachments = await uploadFiles({
          files: req.files as unknown as Express.Multer.File[],
          path: `users/${doc?.createdBy}/posts/${doc?.assetFolderId}/comments/${assetFolderId}`,
        });
      }
      req.body.tags.forEach((tag: string) => {
        eventEmitter.emit("sendEmailToTagged", {
          email: tag,
          link: comment._id,
          subject: `${req.user.email} mentioned you in there comment`,
        });
      });
      const comment = await this._commentModel.create({
        content,
        tags,
        attachments,
        assetFolderId,
        refId: doc?._id as unknown as Types.ObjectId,
        createdBy: req.user?._id,
      });
      if (!comment) {
        deleteFiles({ Keys: attachments });
        throw new AppError("Failed to create comment", 500);
      }
      return res.status(201).json({ message: "Created successfully", comment });
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };
  freezeComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, commentId }: freezeCommentSchemaType = req.params;
      if (userId && req.user?.role !== RoleType.admin) {
        throw new AppError("Unauthorized", 401);
      }
      const comment = await this._commentModel.findOne({
        _id: commentId,
        deletedAt: { $exists: false },
      });

      if (!comment) {
        throw new AppError("Comment not found or already deleted", 404);
      }

      const parent =
        comment.onModel === onModelEnum.Post
          ? await this._postModel.findOne({
              _id: comment.refId,
            })
          : await this._commentModel.findOne({
              _id: comment.refId,
            });

      if (!parent) {
        throw new AppError("Comment does not belong to the given post", 400);
      }

      if (
        req.user?.role !== RoleType.admin &&
        comment.createdBy.toString() !== req.user?._id.toString()
      ) {
        throw new AppError("Unauthorized to freeze this comment", 401);
      }
      comment.deletedAt = new Date();
      comment.deletedBy = req.user?._id;
      await comment.save();
      await this._commentModel.updateMany(
        { refId: commentId, deletedAt: { $exists: false } },
        {
          deletedAt: new Date(),
          deletedBy: req.user?._id,
        }
      );
      return res.status(200).json({ message: "Comment frozen successfully" });
    } catch (error) {
      next(
        new AppError((error as any).message, (error as any).statusCode || 500)
      );
    }
  };
  unfreezeComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, postId, commentId }: freezeCommentSchemaType = req.params;

      if (req.user?.role !== RoleType.admin) {
        throw new AppError("Unauthorized", 401);
      }

      const comment = await this._commentModel.findOne({
        _id: commentId,
        refId: postId,
        createdBy: userId || req.user?._id,
      });

      if (!comment) {
        throw new AppError("Comment not found or unauthorized", 404);
      }

      if (!comment.deletedAt) {
        throw new AppError("Comment is already active", 400);
      }

      comment.restoredAt = new Date();
      comment.restoredBy = req.user?._id;
      comment.deletedAt = undefined;
      comment.deletedBy = undefined;
      await comment.save();
      await this._commentModel.updateMany(
        { refId: commentId, deletedAt: { $exists: true } },
        {
          restoredAt: new Date(),
          restoredBy: req.user?._id,
          $unset: { deletedAt: "", deletedBy: "" },
        }
      );
      return res.status(200).json({ message: "Comment unfrozen successfully" });
    } catch (error) {
      throw new AppError(
        (error as any).message || "Failed to unfreeze comment",
        (error as any).statusCode || 500
      );
    }
  };

  deleteComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, postId, commentId }: freezeCommentSchemaType = req.params;

      if (userId && req.user?.role !== RoleType.admin) {
        throw new AppError("Unauthorized", 401);
      }

      const comment = await this._commentModel.findOne({
        _id: commentId,
        refId: postId,
        createdBy: userId || req.user?._id,
      });

      if (!comment) {
        throw new AppError("Comment not found or unauthorized", 404);
      }

      await comment.deleteOne();
      await this._commentModel.deleteMany({ refId: commentId });

      return res
        .status(200)
        .json({ message: "Comment and its children deleted" });
    } catch (error) {
      throw new AppError(
        (error as any).message || "Failed to delete comment",
        (error as any).statusCode || 500
      );
    }
  };

  updateComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { commentId } = req.params;
      const comment = await this._commentModel.findOne({ _id: commentId });
      if (!comment) {
        throw new AppError("Comment not found", 404);
      }
      if (
        req.user?.role !== RoleType.admin &&
        comment.createdBy.toString() !== req.user?._id.toString()
      ) {
        throw new AppError("Unauthorized", 401);
      }
      if (
        req.body.tags?.length &&
        (
          await this._userModel.find({
            filter: { _id: { $in: req.body.tags } },
          })
        ).length !== req.body.tags?.length
      ) {
        throw new AppError("Invalid User ID", 400);
      }
      let attachments = comment.attachments || [];
      if (req.files?.length) {
        if (attachments.length) {
          await deleteFiles({ Keys: attachments });
        }
        attachments = await uploadFiles({
          files: req.files as unknown as Express.Multer.File[],
          path: `users/${comment.createdBy}/posts/${comment.refId}/comments/${comment.assetFolderId}`,
        });
      }
      comment.content = req.body.content ?? comment.content;
      comment.tags = req.body.tags ?? comment.tags;
      comment.attachments = attachments;
      await comment.save();
      req.body.tags.forEach((tag: string) => {
        eventEmitter.emit("sendEmailToTagged", {
          email: tag,
          link: comment._id,
          subject: `${req.user.email} mentioned you in there comment`,
        });
      });
      return res
        .status(200)
        .json({ message: "Comment updated successfully", comment });
    } catch (error) {
      next(
        new AppError((error as any).message, (error as any).statusCode || 500)
      );
    }
  };
  getCommentWithReply = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { commentId } = req.params;
      const comment = await this._commentModel.findOne(
        { _id: commentId },
        undefined,
        {
          populate: [
            { path: "refId" },
            { path: "createdBy", select: "userName email profileImage" },
          ],
        }
      );
      if (!comment) {
        throw new AppError("Comment not found", 404);
      }
      const replies = await this._commentModel.find({
        filter: { refId: comment._id, onModel: "Comment" },
        options: {
          populate: [
            { path: "createdBy", select: "userName email profileImage" },
          ],
        },
      });
      return res.status(200).json({ message: "Success", comment, replies });
    } catch (error) {
      next(
        new AppError((error as any).message, (error as any).statusCode || 500)
      );
    }
  };
}

export default new CommentServices();
