import { Router } from "express";
import CS from "./chat.service";
import * as CV from "./chat.validation";
import { Authentication } from "../../middleware/authentication.meddleware";
import {
  fileValidation,
  multerCloud,
} from "../../middleware/multer.middleware";
import validation from "../../middleware/validation.middleware";
const chatRouter = Router({ mergeParams: true });
chatRouter.get("/", validation(CV.getChatSchema), Authentication(), CS.getChat);
chatRouter.post(
  "/group",
  Authentication(),
  multerCloud({
    fileTypes: fileValidation.image,
  }).single("attachment"),
  validation(CV.createGroupChatSchema),
  CS.createGroupChat
);

chatRouter.get(
  "/group/:groupId",
  validation(CV.getGroupChatSchema),
  Authentication(),
  CS.getGroupChat
);
export default chatRouter;
