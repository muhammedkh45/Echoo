import { Router } from "express";
import US from "./users.services";
import * as UV from "./users.validation";
import validation from "../../middleware/validation.middleware";
const userRouter = Router();
userRouter.post("/signUp", validation(UV.signUpSchema), US.signUp);
userRouter.post("/login", validation(UV.logInSchema), US.logIn);
userRouter.patch("/confirmEmail",validation(UV.confirmEmailSchema), US.confirmEmail);
export default userRouter;
