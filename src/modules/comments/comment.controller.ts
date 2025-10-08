import { Router } from "express";
import validation from "../../middleware/validation.middleware";
import * as CV from "./comment.validation";
import CS from "./comment.services";
import { Authentication } from "../../middleware/authentication.meddleware";
import {
  fileValidation,
  multerCloud,
} from "../../middleware/multer.middleware";
const commentRouter = Router({ mergeParams: true });

commentRouter.get(
  "/:commentId/replies",
  Authentication(),
  CS.getCommentWithReply
);
commentRouter.post(
  "/",
  Authentication(),
  multerCloud({ fileTypes: fileValidation.image }).array("attachments", 2),
  validation(CV.createCommentSchema),
  CS.createComment
);
commentRouter.patch(
  "/freeze{/:userId}{/:postId}",
  Authentication(),
  validation(CV.freezeSchema),
  CS.freezeComment
);
commentRouter.patch(
  "/unfreeze{/:userId}{/:postId}",
  Authentication(),
  validation(CV.freezeSchema),
  CS.unfreezeComment
);
commentRouter.delete(
  "/unfreeze{/:userId}{/:postId}",
  Authentication(),
  validation(CV.freezeSchema),
  CS.deleteComment
);
commentRouter.patch(
  "/update/:postId",
  Authentication(),
  multerCloud({ fileTypes: fileValidation.image }).array("attachments", 2),
  validation(CV.createCommentSchema),
  CS.updateComment
);

export default commentRouter;

//localhost:3000/posts/:postId/comments
