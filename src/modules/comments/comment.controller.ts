import { Router } from "express";
import validation from "../../middleware/validation.middleware";
import * as CV from "./comment.validation";
import CS from "./comment.services";
import { Authentication } from "../../middleware/authentication.meddleware";
import {
  fileValidation,
  multerCloud,
} from "../../middleware/multer.middleware";
const commentRouter = Router({mergeParams:true});
commentRouter.post(
  "/",
  Authentication(),
  multerCloud({ fileTypes: fileValidation.image }).array("attachments", 2),
  validation(CV.createCommentSchema),
  CS.createComment
);
commentRouter.patch(
  "/:postId/action",
  Authentication(),
  validation(CV.commentLikeSchema),
  CS.likeComment
);
commentRouter.patch(
  "/update/:postId",
  Authentication(),
  multerCloud({ fileTypes: fileValidation.image }).array("attachments", 2),
  validation(CV.updateCommentSchema),
  CS.updateComment
);
export default commentRouter;

//localhost:3000/posts/:postId/comments