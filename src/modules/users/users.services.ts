import { NextFunction, Request, Response } from "express";
import { AppError } from "../../utils/classError";
import userModel, {
  IUser,
  ProviderType,
  RoleType,
} from "../../DB/model/user.model";
import { HydratedDocument } from "mongoose";
import {
  confirmEmailSchemaType,
  forgetPasswordSchemaType,
  freezeSchemaType,
  logInSchemaType,
  logInWithGoogleSchemaType,
  logOutSchemaType,
  resetPasswordSchemaType,
  signUpSchemaType,
} from "./users.validation";
import { UserRepository } from "../../DB/repositories/user.repository";
import { Compare, Hash } from "../../utils/Security/Hash";
import { eventEmitter } from "../../utils/Events/Email.event";
import { generateOTP } from "../../utils/Security/OTPGenerator";
import { generateToken } from "../../utils/Security/Token";
import { uuid } from "uuidv4";
import { RevokeTokenRepository } from "../../DB/repositories/revokeToken.repository";
import revokeTokenModel from "../../DB/model/revokeToken.model";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { multerCloud } from "../../middleware/multer.middleware";
import {
  createPresignedUrl,
  deleteFile,
  deleteFiles,
  getFile,
  getFilePreSignedUrl,
  listFiles,
  uploadFile,
  uploadFiles,
  uploadLargeFile,
} from "../../utils/s3.config";
import { promisify } from "node:util";
import { pipeline } from "node:stream";
class UserServices {
  private _userModel = new UserRepository(userModel);
  private _revokeTokenModel = new RevokeTokenRepository(revokeTokenModel);
  constructor() {}
  signUp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let {
        userName,
        email,
        password,
        age,
        address,
        phone,
        gender,
      }: signUpSchemaType = req.body;

      if (await this._userModel.findOne({ email })) {
        throw new AppError("Email already exists.", 409);
      }
      const OTP = await generateOTP();
      const hashedOTP = await Hash(OTP, Number(process.env.SALT_ROUNDS));
      eventEmitter.emit("sendEmail", { email, OTP, subject: "Confirm Email" });
      password = await Hash(
        password as unknown as string,
        Number(process.env.SALT_ROUNDS)
      );
      const user: HydratedDocument<IUser> = await this._userModel.createOneUser(
        {
          userName,
          email,
          password,
          age,
          address,
          phone,
          gender,
          otp: hashedOTP,
        }
      );
      return res.status(201).json({
        message: "Created Successfuly.",
        NewUser: { Name: user.userName, email: user.email },
      });
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };
  logIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let { email, password }: logInSchemaType = req.body;
      const user = await this._userModel.findOne({
        email,
        // provider: ProviderType.system,
      });
      if (!user) {
        throw new AppError("Email or Password is Invalid.", 401);
      }
      const match = await Compare(password as unknown as string, user.password);

      if (!match) {
        throw new AppError("Email or Password is Invalid.", 401);
      }
      if (!user.isVerified) {
        throw new AppError("Please verify your email before login", 403);
      }
      const tokenId = uuid();
      const accessToken = await generateToken(
        { id: user._id, email: user.email },
        user?.role == RoleType.user
          ? process.env.JWT_USER_SECRET!
          : process.env.JWT_ADMIN_SECRET!,
        { expiresIn: "1h", jwtid: tokenId }
      );
      const refreshToken = await generateToken(
        { id: user._id, email: user.email },
        user?.role == RoleType.user
          ? process.env.JWT_USER_SECRET_REFRESH!
          : process.env.JWT_ADMIN_SECRET_REFRESH!,
        {
          jwtid: tokenId,
        }
      );
      return res
        .status(200)
        .json({ message: "Logged-in Successfuly.", accessToken, refreshToken });
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };
  confirmEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, otp }: confirmEmailSchemaType = req.body;
      const user = await this._userModel.findOne({ email });
      if (!user) {
        throw new AppError("User not found.", 404);
      }
      if (user.isVerified) {
        return res.status(200).json({ message: "Email already verified" });
      }
      if (!user.otp || !(await Compare(otp!, user.otp))) {
        throw new AppError("Invalid OTP", 400);
      }
      if (
        user.otpExpires &&
        user.otpExpires < (Date.now() as unknown as Date)
      ) {
        throw new AppError("OTP expired", 400);
      }
      await this._userModel.updateOne(
        { email: user.email },
        { isVerified: true, $unset: { otp: "", otpExpires: "" } }
      );
      return res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };
  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      return res.status(200).json({ message: "User Profile.", user: req.user });
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };
  logOut = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { flag }: logOutSchemaType = req.body;
      if (flag === "all") {
        await this._userModel.updateOne(
          { _id: req.user._id },
          { changeCredentials: new Date() }
        );
        return res
          .status(200)
          .json({ message: "logged out successfully from all devices" });
      }
      await this._revokeTokenModel.create({
        tokenId: req.decoded.jti,
        userId: req.user._id,
        expiresAt: new Date(req.decoded.exp! * 1000),
      });
      return res
        .status(200)
        .json({ message: "logged out successfully from current device" });
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };
  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    const tokenId = uuid();
    const accessToken = await generateToken(
      { id: req?.user?._id, email: req?.user?.email },
      req?.user?.role == RoleType.user
        ? process.env.JWT_USER_SECRET!
        : process.env.JWT_ADMIN_SECRET!,
      { expiresIn: "1h", jwtid: tokenId }
    );
    const refreshToken = await generateToken(
      { id: req?.user?._id, email: req?.user?.email },
      req?.user?.role == RoleType.user
        ? process.env.JWT_USER_SECRET_REFRESH!
        : process.env.JWT_ADMIN_SECRET_REFRESH!,
      {
        jwtid: tokenId,
      }
    );
    await this._revokeTokenModel.create({
      tokenId: req.decoded.jti,
      userId: req.user._id,
      expiresAt: new Date(),
    });
    return res
      .status(200)
      .json({ message: "Refreshed Successfuly.", accessToken, refreshToken });
  };
  loginWithGmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token }: logInWithGoogleSchemaType = req.body;
      const client = new OAuth2Client();
      async function verify() {
        const ticket = await client.verifyIdToken({
          idToken: token as string,
          audience: process.env.WEB_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        return payload;
      }
      const { email, email_verified, picture, name } =
        (await verify()) as TokenPayload;
      let user = await this._userModel.findOne({ email });
      if (!user) {
        user = await this._userModel.create({
          userName: name,
          email,
          isVerified: email_verified,
          image: picture,
          provider: ProviderType.google,
        });
      } else {
        throw new Error("Email already exits.", { cause: 409 });
      }
      if (user.provider !== ProviderType.google) {
        throw new Error("Please login on system ", { cause: 401 });
      }
      const tokenId = uuid();
      const accessToken = await generateToken(
        { id: req?.user?._id, email: req?.user?.email },
        req?.user?.role == RoleType.user
          ? process.env.JWT_USER_SECRET!
          : process.env.JWT_ADMIN_SECRET!,
        { expiresIn: "1h", jwtid: tokenId }
      );
      const refreshToken = await generateToken(
        { id: req?.user?._id, email: req?.user?.email },
        req?.user?.role == RoleType.user
          ? process.env.JWT_USER_SECRET_REFRESH!
          : process.env.JWT_ADMIN_SECRET_REFRESH!,
        {
          jwtid: tokenId,
        }
      );
      res
        .status(200)
        .json({ message: "Loged in successfully", accessToken, refreshToken });
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };
  forgetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email }: forgetPasswordSchemaType = req.body;
      const user = await this._userModel.findOne({ email });
      if (!user) {
        throw new AppError("User not found", 404);
      }
      if (!user.isVerified) {
        throw new AppError("Please verify your email.", 403);
      }
      const OTP = await generateOTP();
      const hashedOTP = await Hash(OTP, Number(process.env.SALT_ROUNDS));
      eventEmitter.emit("forgetPassword", {
        email,
        OTP,
        subject: "Reset Your Password",
      });
      await this._userModel.updateOne({ email }, { otp: hashedOTP });
      return res
        .status(200)
        .json({ message: "OTP have been sent Successfully." });
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };
  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, otp, password }: resetPasswordSchemaType = req.body;
      const user = await this._userModel.findOne({
        email,
        otp: { $exists: true },
      });
      if (!user) {
        throw new AppError("User not found", 404);
      }
      if (!(await Compare(otp!, user?.otp!))) {
        throw new AppError("Wrong OTP", 403);
      }
      const hashedPassword = await Hash(
        password as unknown as string,
        Number(process.env.SALT_ROUNDS)
      );
      await this._userModel.updateOne(
        { email: user?.email },
        { password: hashedPassword, $unset: { otp: "" } }
      );
      return res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };
  uploadImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ContentType, originalname } = req.body;
      const { url, Key } = await createPresignedUrl({
        ContentType,
        originalname,
        path: `users/${req.user?._id}/coverimage`,
      });
      const user = await this._userModel.findOneAndUpdate(
        { _id: req.user._id },
        { profileImage: Key, tempProfileImage: req.user?.profileImage }
      );
      if (!user) {
        throw new AppError("User not found", 404);
      }
      eventEmitter.emit("uploadImage", {
        userId: req.user?._id,
        oldKey: req.user?.profileImage,
        Key,
        expiresIn: 60,
      });
      return res.status(200).json({ message: "Success", url, user });
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };
  uploadImages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = await uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${req.user._id}`,
      });
      return res.status(200).json({ message: "Success", key });
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };
  presignedUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { originalname, ContentType } = req.body;
      const url = await createPresignedUrl({
        originalname,
        ContentType,
        path: `users/${req.user._id}`,
      });
      return res.status(200).json({ message: "success", url });
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };

  getFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const writePipeLine = promisify(pipeline);
      const { path } = req.params as unknown as { path: string[] };
      const { downloadName } = req.query as { downloadName: string };
      const key = path.join("/");
      const file = await getFile({ Key: key });
      const stream = file.Body as NodeJS.ReadableStream;
      res.setHeader("Content-Type", file?.ContentType!);
      writePipeLine(stream, res);
      if (downloadName) {
        res.setHeader(
          "Content-Desposition",
          `attachment; filename="${
            downloadName || path.join("/").split("/").pop()
          }"`
        );
      }
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };
  getPreSignedFile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { path } = req.params as unknown as { path: string[] };
      const key = path.join("/");
      const url = await getFilePreSignedUrl({ Key: key });
      res.status(200).json({ messgae: "Done", url });
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };
  deleteFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { path } = req.params as unknown as { path: string[] };
      const key = path.join("/");
      const file = await deleteFile({ Key: key });
      return res.status(200).json({ messgae: "Success", file });
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };
  deleteFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { Keys } = req.body;
      const files = await deleteFiles({ Keys });
      return res.status(200).json({ messgae: "Success", files });
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };
  listFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { path } = req.params as { path: string };
      const files = await listFiles({ path });
      return res.status(200).json({ message: "Success", files });
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };
  freezeAccount = async (req: Request, res: Response, next: NextFunction) => {
    const { userId }: freezeSchemaType = req.params;
    if (userId && req.user?.role !== RoleType.admin) {
      throw new AppError("UnAuthorized", 401);
    }
    const user = await this._userModel.findOneAndUpdate(
      { _id: userId || req.user?._id, deletedAt: { $exists: false } },
      {
        deletedAt: new Date(),
        deletedBy: req.user?._id,
        changeCredentials: new Date(),
      }
    );
    if (!user) {
      throw new AppError("User not found.", 404);
    }
    return res.status(200).json({ message: "Freezed" });
  };

  unfreezeAccount = async (req: Request, res: Response, next: NextFunction) => {
    const { userId }: freezeSchemaType = req.params;
    if (req.user?.role !== RoleType.admin) {
      throw new AppError("UnAuthorized", 401);
    }
    const user = await this._userModel.findOneAndUpdate(
      {
        _id: userId || req.user?._id,
        deletedAt: { $exists: true },
        deletedBy: { $ne: req.user?._id },
      },
      {
        restoredAt: new Date(),
        restoredBy: req.user?._id,
        $unset: { deletedAt: "", deletedBy: "" },
      }
    );
    if (!user) {
      throw new AppError("User not found.", 404);
    }
    return res.status(200).json({ message: "Freezed" });
  };
}

export default new UserServices();
