import { NextFunction, Request, Response } from "express";
import postModel, { AvailabilityEnum, IPost } from "../../DB/model/post.model";
import { PostRepository } from "../../DB/repositories/post.repository";
import userModel from "../../DB/model/user.model";
import { UserRepository } from "../../DB/repositories/user.repository";
import { AppError } from "../../utils/classError";
import { deleteFiles, uploadFiles } from "../../utils/s3.config";
import { uuid } from "uuidv4";
import {
  ActionEnum,
  likePostQueryDTO,
  PostLikeSchemaType,
  updatePostParamsDTO,
} from "./posts.validation";
import { UpdateQuery } from "mongoose";

class PostServices {
  private _postModel = new PostRepository(postModel);
  private _userModel = new UserRepository(userModel);
  constructor() {}

  createPost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (
        req.body.tags?.length &&
        (await this._userModel.find({ _id: { $in: req.body.tags } })).length !==
          req.body.tags?.length
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
      return res.status(201).json({ message: "Created successfully", post });
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };
  likePost = async (req: Request, res: Response, next: NextFunction) => {
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
          (await this._userModel.find({ _id: { $in: req.body.tags } }))
            .length !== req.body.tags?.length
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
}

export default new PostServices();
