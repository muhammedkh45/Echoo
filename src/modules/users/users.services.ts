import { NextFunction, Request, Response } from "express";
import { AppError } from "../../utils/classError";
import userModel, { IUser } from "../../DB/model/user.model";
import { HydratedDocument } from "mongoose";
import { signUpSchemaType } from "./users.validation";
import { UserRepository } from "../../DB/repositories/user.repositort";
import { Compare, Hash } from "../../utils/Security/Hash";
import { eventEmitter } from "../../utils/Events/Email.event";
import { generateOTP } from "../../utils/Security/OTPGenerator";
import { generateToken } from "../../utils/Security/Token";
class UserServices {
  private _userModel = new UserRepository(userModel);
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
      const { email, password } = req.body;
      const user = await this._userModel.findOne({ email });
      if (!user) {
        throw new AppError("Email or Password is Invalid.", 401);
      }
      const match = await Compare(password, user.password);
      console.log(match);

      if (!match) {
        throw new AppError("Email or Password is Invalid.", 401);
      }
      const accessToken = await generateToken(
        { email },
        process.env.JWT_SECRET as unknown as string,
        { expiresIn: "1h" }
      );
      const refreshToken = await generateToken(
        { email },
        process.env.JWT_SECRET as unknown as string
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
}
export default new UserServices();
