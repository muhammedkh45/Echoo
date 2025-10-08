import { NextFunction, Request, Response } from "express";
import { PostRepository } from "../../DB/repositories/post.repository";
import { UserRepository } from "../../DB/repositories/user.repository";
import userModel from "../../DB/model/user.model";
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
} from "./comment.validation";
import { deleteFiles, uploadFiles } from "../../utils/s3.config";
import { uuid } from "uuidv4";
import { populate } from "dotenv";
import { HydratedDocument, Types } from "mongoose";

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
  likeComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      //   const { postId }: PostLikeSchemaType = req.params;
      //   const { action }: likePostQueryDTO = req.query;
      //   let updateQuery: UpdateQuery<IPost> = {
      //     $addToSet: { likes: req.user?._id },
      //   };
      //   if (action === ActionEnum.unlike) {
      //     updateQuery = { $pull: { likes: req.user?._id } };
      //   }
      //   const post = await this._postModel.findOneAndUpdate(
      //     {
      //       id: postId,
      //       $or: [
      //         { availability: AvailabilityEnum.public },
      //         {
      //           availability: AvailabilityEnum.private,
      //           createdBy: req.user?._id,
      //         },
      //         {
      //           availability: AvailabilityEnum.friends,
      //           createdBy: { $in: [...(req.user?.friends || []), req.user?._id] },
      //         },
      //       ],
      //     },
      //     { ...updateQuery },
      //     { new: true }
      //   );
      //   if (!post) {
      //     throw new AppError(`Faild to ${action} post`, 404);
      //   }
      //   return res.status(201).json({ message: `${action} successfully`, post });
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };
  updateComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      //   const { postId }: updatePostParamsDTO = req.params;
      //   const post = await this._postModel.findOne({ id: postId });
      //   if (!post) {
      //     throw new AppError("Not Found", 404);
      //   }
      //   if (post && req.user?._id !== post.createdBy) {
      //     throw new AppError("Unauthorized", 401);
      //   }
      //   if (req?.body?.content) {
      //     post.content = req.body.content;
      //   }
      //   if (req?.body?.availability) {
      //     post.availability = req.body.availability;
      //   }
      //   if (req?.body?.allowComment) {
      //     post.allowComment = req.body.allowComment;
      //   }
      //   if (req?.files?.length) {
      //     await deleteFiles({ Keys: post.attachments! });
      //     post.attachments = await uploadFiles({
      //       files: req?.files as unknown as Express.Multer.File[],
      //       path: `users/${req.user?._id}/posts/${post.assetFolderId}`,
      //     });
      //   }
      //   if (req.body.tags.length) {
      //     if (
      //       req.body.tags?.length &&
      //       (await this._userModel.find({ _id: { $in: req.body.tags } }))
      //         .length !== req.body.tags?.length
      //     ) {
      //       throw new AppError("InValid User ID ");
      //     }
      //     post.tags = req.body.tags;
      //   }
      //   await post.save();
      //   return res.status(200).json({ message: "Updated", post });
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };
}

export default new CommentServices();
