import { NextFunction, Request, Response } from "express";
import postModel, { AvailabilityEnum, IPost } from "../../DB/model/post.model";
import { PostRepository } from "../../DB/repositories/post.repository";
import userModel, { RoleType } from "../../DB/model/user.model";
import { UserRepository } from "../../DB/repositories/user.repository";
import { AppError } from "../../utils/classError";
import { deleteFiles, uploadFiles } from "../../utils/s3.config";
import { uuid } from "uuidv4";
import {
  ActionEnum,
  freezePostSchemaType,
  likePostQueryDTO,
  PostLikeSchemaType,
  updatePostParamsDTO,
} from "./posts.validation";
import { UpdateQuery } from "mongoose";
import { eventEmitter } from "../../utils/Events/Email.event";
import { CommentRepository } from "../../DB/repositories/comment.repository";
import commentModel from "../../DB/model/comment.model";
import { GraphQLError } from "graphql";

class PostServices {
  private _postModel = new PostRepository(postModel);
  private _userModel = new UserRepository(userModel);
  private _commentModel = new CommentRepository(commentModel);
  constructor() {}

  createPost = async (req: Request, res: Response, next: NextFunction) => {
    try {
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
      let attachments: string[] = [];
      if (req.files?.length) {
        attachments = await uploadFiles({
          files: req.files as unknown as Express.Multer.File[],
          path: `users/${req.user._id}/posts/${assetFolderId}`,
        });
      }

      const post = await this._postModel.create({
        ...req.body,
        attachments,
        assetFolderId,
        createdBy: req.user?._id,
      });
      if (!post) {
        deleteFiles({ Keys: attachments });
        throw new AppError("Failed to create post", 500);
      }
      req.body.tags.forEach((tag: string) => {
        eventEmitter.emit("sendEmailToTagged", {
          email: tag,
          link: post._id,
          subject: `${req.user.email} mentioned you in there post`,
        });
      });
      return res.status(201).json({ message: "Created successfully", post });
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };
  freezePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, postId }: freezePostSchemaType = req.params;
      if (userId && req.user?.role !== RoleType.admin) {
        throw new AppError("UnAuthorized", 401);
      }
      const post = await this._postModel.findOneAndUpdate(
        {
          _id: postId,
          createdBy: userId || req.user?._id,
          deletedAt: { $exists: false },
        },
        {
          deletedAt: new Date(),
          deletedBy: req.user?._id,
        }
      );
      if (!post) {
        throw new AppError("Post not found.", 404);
      }
      return res.status(200).json({ message: "Post Freezed" });
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };
  unfreezePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, postId }: freezePostSchemaType = req.params;
      if (req.user?.role !== RoleType.admin) {
        throw new AppError("UnAuthorized", 401);
      }
      const post = await this._postModel.findOneAndUpdate(
        {
          _id: postId,
          createdBy: userId || req.user?._id,
          deletedAt: { $exists: true },
          deletedBy: { $ne: req.user?._id },
        },
        {
          restoredAt: new Date(),
          restoredBy: req.user?._id,
          $unset: { deletedAt: "", deletedBy: "" },
        }
      );
      if (!post) {
        throw new AppError("User not found.", 404);
      }
      return res.status(200).json({ message: "Freezed" });
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };
  deletePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, postId }: freezePostSchemaType = req.params;
      if (userId && req.user?.role !== RoleType.admin) {
        throw new AppError("UnAuthorized", 401);
      }
      const post = await this._postModel.findOneAndDelete({
        _id: postId,
        createdBy: userId || req.user?._id,
      });
      if (!post) {
        throw new AppError("Post not found.", 404);
      }
      await this._commentModel.deleteMany({ postId });
      return res.status(200).json({ message: "Post Deleted", post });
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };
  like_Unlike_Post = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { postId }: PostLikeSchemaType = req.params;
      const { action }: likePostQueryDTO = req.query;
      let updateQuery: UpdateQuery<IPost> = {
        $addToSet: { likes: req.user?._id },
      };
      if (action === ActionEnum.unlike) {
        updateQuery = { $pull: { likes: req.user?._id } };
      }
      const post = await this._postModel.findOneAndUpdate(
        {
          id: postId,
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
        },
        { ...updateQuery },
        { new: true }
      );
      if (!post) {
        throw new AppError(`Faild to ${action} post`, 404);
      }
      return res.status(201).json({ message: `${action} successfully`, post });
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };
  updatePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { postId }: updatePostParamsDTO = req.params;
      const post = await this._postModel.findOne({ id: postId });
      if (!post) {
        throw new AppError("Not Found", 404);
      }
      if (post && req.user?._id !== post.createdBy) {
        throw new AppError("Unauthorized", 401);
      }
      if (req?.body?.content) {
        post.content = req.body.content;
      }
      if (req?.body?.availability) {
        post.availability = req.body.availability;
      }
      if (req?.body?.allowComment) {
        post.allowComment = req.body.allowComment;
      }
      if (req?.files?.length) {
        await deleteFiles({ Keys: post.attachments! });
        post.attachments = await uploadFiles({
          files: req?.files as unknown as Express.Multer.File[],
          path: `users/${req.user?._id}/posts/${post.assetFolderId}`,
        });
      }
      if (req.body.tags.length) {
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
        post.tags = req.body.tags;
      }
      await post.save();
      return res.status(200).json({ message: "Updated", post });
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };
  getPosts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let { page = 1, limit = 5 } = req.query as unknown as {
        page: number;
        limit: number;
      };
      const posts = await this._postModel.paginate({
        filter: {},
        query: { page, limit },
      });
      return res.status(200).json({ Message: "Success", posts });
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };
  getPostsWithComments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      let { page = 1, limit = 5 } = req.query as unknown as {
        page: number;
        limit: number;
      };
      const posts = await this._postModel.paginate({
        filter: {},
        query: { page, limit },
        options: {
          populate: [
            {
              path: "comments",
              match: {
                commentId: {
                  $exists: false,
                },
              },
              populate: {
                path: "replies",
              },
            },
          ],
        },
      });
      return res.status(200).json({ Message: "Success", posts });
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };
  getPostById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { postId } = req.params;
      const post = await this._postModel.findOne({ _id: postId }, undefined, {
        populate: [
          { path: "createdBy", select: "userName email profileImage" },
        ],
      });
      if (!post) {
        throw new AppError("Post not found", 404);
      }
      return res.status(200).json({ message: "Success", post });
    } catch (error) {
      next(
        new AppError((error as any).message, (error as any).statusCode || 500)
      );
    }
  };

  //==============GQL================
  getPostsGQL = async (parent: any, args: any) => {
    const posts = await this._postModel.find({ filter: {} });
    if (posts.length === 0) {
      throw new GraphQLError("No posts found.", {
        extensions: { statusCode: 404 },
      });
    }
  };
}

export default new PostServices();
