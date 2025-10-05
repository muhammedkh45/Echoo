import { Router } from "express";
import validation from "../../middleware/validation.middleware";
import * as PV from "./posts.validation";
import PS from "./posts.services";
import { Authentication } from "../../middleware/authentication.meddleware";
import {
  fileValidation,
  multerCloud,
} from "../../middleware/multer.middleware";
const postRouter = Router();
postRouter.post(
  "/create",
  Authentication(),
  multerCloud({ fileTypes: fileValidation.image }).array("attachments", 2),
  validation(PV.createPostSchema),
  PS.createPost
);
postRouter.patch(
  "/:postId/action",
  Authentication(),
  validation(PV.postLikeSchema),
  PS.likePost
);
postRouter.patch(
  "/update/:postId",
  Authentication(),
  multerCloud({ fileTypes: fileValidation.image }).array("attachments", 2),
  validation(PV.updatePostSchema),
  PS.updatePost
);
export default postRouter;
