import { Router } from "express";
import validation from "../../middleware/validation.middleware";
import * as PV from "./posts.validation";
import PS from "./posts.services";
import { Authentication } from "../../middleware/authentication.meddleware";
import {
  fileValidation,
  multerCloud,
} from "../../middleware/multer.middleware";
import commentRouter from "../comments/comment.controller";
const postRouter = Router();
postRouter.get("/:postId", PS.getPostById);
postRouter.use("/:postId/comments{/:commentId/reply}", commentRouter);
postRouter.post(
  "/create",
  Authentication(),
  multerCloud({ fileTypes: fileValidation.image }).array("attachments", 2),
  validation(PV.createPostSchema),
  PS.createPost
);
postRouter.patch(
  "/freeze{/:userId}{/:postId}",
  Authentication(),
  validation(PV.freezeSchema),
  PS.freezePost
);
postRouter.patch(
  "/unfreeze{/:userId}{/:postId}",
  Authentication(),
  validation(PV.freezeSchema),
  PS.unfreezePost
);
postRouter.delete(
  "/unfreeze{/:userId}{/:postId}",
  Authentication(),
  validation(PV.freezeSchema),
  PS.deletePost
);
postRouter.patch(
  "/:postId/action",
  Authentication(),
  validation(PV.postLikeSchema),
  PS.like_Unlike_Post
);
postRouter.patch(
  "/update/:postId",
  Authentication(),
  multerCloud({ fileTypes: fileValidation.image }).array("attachments", 2),
  validation(PV.updatePostSchema),
  PS.updatePost
);
postRouter.get("/", PS.getPosts);
export default postRouter;
