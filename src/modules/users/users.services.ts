import { NextFunction, Request, Response } from "express";
import { AppError } from "../../utils/classError";
interface ISignUP {
  name: string;
  email: string;
  password: number;
  cPassword: number;
}
class UserServices {
  constructor() {}
  signUp = (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, cPassword }: ISignUP = req.body;
      return res
        .status(201)
        .json({ message: "Created Successfuly.", body: req.body });
    } catch (error) {
      throw new AppError("Error Happend in signUp function", 500);
    }
  };
  logIn = (req: Request, res: Response, next: NextFunction) => {
    try {
      return res.status(200).json({ message: "Logged-in Successfuly." });
    } catch (error) {
      throw new AppError("Error Happend in signUp function", 500);
    }
  };
}
export default new UserServices();
