import { Router } from "express";
import US from "./users.services";
import * as UV from "./users.validation";
import validation from "../../middleware/validation.middleware";
import { Authentication } from "../../middleware/authentication.meddleware";
import { TokenType } from "../../utils/Security/Token";
import {
  fileValidation,
  multerCloud,
} from "../../middleware/multer.middleware";
import { Authorization } from "../../middleware/authorization.middleware";
import { RoleType } from "../../DB/model/user.model";
const userRouter = Router();
userRouter.post("/signUp", validation(UV.signUpSchema), US.signUp);
userRouter.post("/login", validation(UV.logInSchema), US.logIn);
userRouter.post(
  "/google-login",
  validation(UV.logInWithGoogleSchema),
  US.loginWithGmail
);
userRouter.patch(
  "/confirmEmail",
  validation(UV.confirmEmailSchema),
  US.confirmEmail
);
userRouter.patch(
  "/confirmNewEmail",
  validation(UV.confirmEmailSchema),
  US.verifyNewEmail
);
userRouter.patch(
  "/forget-password",
  validation(UV.forgetPasswordSchema),
  US.forgetPassword
);
userRouter.patch(
  "/rest-password",
  validation(UV.resetPasswordSchema),
  US.resetPassword
);
userRouter.get("/profile", Authentication(), US.getProfile);
userRouter.get(
  "/logout",
  Authentication(),
  validation(UV.logOutSchema),
  US.logOut
);
userRouter.get(
  "/refreshtoken",
  Authentication(TokenType.refresh),
  US.refreshToken
);
userRouter.get(
  "/upload/pre-signed/*path",
  Authentication(),
  US.getPreSignedFile
);
userRouter.get("/upload/*path", Authentication(), US.getFile);
userRouter.get("/upload/listFiles/path", Authentication(), US.listFiles);
userRouter.get("/upload/delete/*path", Authentication(), US.deleteFile);
userRouter.delete("/upload/delete-files", Authentication(), US.deleteFiles);
userRouter.post(
  "/upload",
  Authentication(),
  multerCloud({ fileTypes: fileValidation.image }).single("file"),
  US.uploadImage
);
userRouter.post(
  "/upload-many",
  Authentication(),
  multerCloud({ fileTypes: fileValidation.image }).array("files"),
  US.uploadImage
);
userRouter.post(
  "/get-presigned-url",
  Authentication(),
  multerCloud({ fileTypes: fileValidation.image }).single("file"),
  US.presignedUrl
);
userRouter.patch(
  "/freeze{/:userId}",
  validation(UV.freezeSchema),
  Authentication(),
  US.freezeAccount
);
userRouter.patch(
  "/unfreeze/:userId",
  validation(UV.freezeSchema),
  Authentication(),
  US.unfreezeAccount
);
userRouter.get(
  "/dashboard",
  Authentication(),
  Authorization({ accessRoles: [RoleType.admin, RoleType.superAdmin] }),
  US.dashBoard
);
userRouter.patch(
  "/changeRole/:userId",
  Authentication(),
  Authorization({ accessRoles: [RoleType.admin, RoleType.superAdmin] }),
  US.updateRole
);
userRouter.post("/sendRequest/:userId", Authentication(), US.sendRequest);
userRouter.patch(
  "/actionRequest/:requestId?action=",
  Authentication(),
  validation(UV.actionOnReqSchema),
  US.actionOnRequest
);
userRouter.patch(
  "/updatePassword",
  Authentication(),
  validation(UV.updatePasswordSchema),
  US.updatePassword
);
userRouter.patch(
  "/updateProfile",
  Authentication(),
  validation(UV.updatePasswordSchema),
  US.updateProfile
);
userRouter.patch(
  "/updateEmail",
  Authentication(),
  validation(UV.updateEmailSchema),
  US.updateEmail
);
userRouter.patch("/enable-2fa-request", Authentication(), US.enable2FARequest);
userRouter.patch(
  "/enable-2fa-confirm",
  Authentication(),
  validation(UV.confirmNewEmailSchema),
  US.enable2FAConfirm
);
userRouter.patch(
  "/login-confirm",
  validation(UV.confirmEmailSchema),
  US.confirmLogIn
);
export default userRouter;
