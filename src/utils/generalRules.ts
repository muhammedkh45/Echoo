import mongoose from "mongoose";
import z from "zod";

export const generalRules = {
  id: z.string().refine(
    (data) => {
      return mongoose.Types.ObjectId.isValid(data);
    },
    {
      message: "INvalid user Id",
    }
  ),
  email: z.email(),
  password: z
    .string()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    ),
  otp: z.string().regex(/^[0-9]{6}$/),
  file: z.object({
    filename: z.string(),
    originalname: z.string(),
    encoding: z.string(),
    mimetype: z.string(),
    buffer: z.any().optional(),
    path: z.string().optional(),
    size: z.number(),
  }),
};
