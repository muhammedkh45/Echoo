import * as z from "zod";
import { GenderType, RoleType } from "../../DB/model/user.model";
import { Types } from "mongoose";
import { generalRules } from "../../utils/generalRules";
export const signUpSchema = {
  body: z
    .strictObject({
      userName: z.string().min(3).max(15).trim(),
      email: generalRules.email,
      password: generalRules.password,
      cPassword: z.string(),
      age: z.number().min(18),
      address: z
        .string()
        .regex(/^[0-9a-zA-Z\s,.-]{5,100}$/)
        .optional(),
      phone: z
        .string()
        .regex(/^\+?[0-9]{1,3}?[-.\s]?(\(?\d{1,4}\)?[-.\s]?)*\d{1,4}$/)
        .optional(),
      gender: z.enum(GenderType),
      role: z.enum(RoleType).default(RoleType.user).optional(),
    })
    .superRefine((data, ctx) => {
      if (data.password !== data.cPassword) {
        ctx.addIssue({
          code: "custom",
          message: "Not matching",
        });
      }
    }),
};
export const logInSchema = {
  body: z.strictObject({
    email: z.email(),
    password: z
      .string()
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      ),
  }),
};
export const confirmEmailSchema = {
  body: z
    .strictObject({
      email: z.email(),
      otp: generalRules.otp,
    })
    .required(),
};
export const logOutSchema = {
  body: z.strictObject({
    flag: z.enum(["all", "current"]).default("current"),
  }),
};
export const logInWithGoogleSchema = {
  body: z
    .strictObject({
      token: z.string(),
    })
    .required(),
};
export const forgetPasswordSchema = {
  body: z
    .strictObject({
      email: z.email(),
    })
    .required(),
};
export const resetPasswordSchema = {
  body: confirmEmailSchema.body
    .extend({
      password: z
        .string()
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        ),
      cPassword: z.string(),
    })
    .required()
    .superRefine((data, ctx) => {
      if (data.password !== data.cPassword) {
        ctx.addIssue({
          code: "custom",
          message: "Not matching",
        });
      }
    }),
};
export const freezeSchema = {
  params: z
    .strictObject({
      userId: z.string().optional(),
    })
    .refine(
      (value) => {
        return value?.userId ? Types.ObjectId.isValid(value.userId) : true;
      },
      {
        message: "UserId is not 24 hex",
        path: ["freeze schema -> userId"],
      }
    ),
};

export type signUpSchemaType = Partial<z.infer<typeof signUpSchema.body>>;
export type logInSchemaType = Partial<z.infer<typeof logInSchema.body>>;
export type logOutSchemaType = Partial<z.infer<typeof logOutSchema.body>>;
export type forgetPasswordSchemaType = Partial<
  z.infer<typeof forgetPasswordSchema.body>
>;
export type resetPasswordSchemaType = Partial<
  z.infer<typeof resetPasswordSchema.body>
>;
export type logInWithGoogleSchemaType = Partial<
  z.infer<typeof logInWithGoogleSchema.body>
>;
export type confirmEmailSchemaType = Partial<
  z.infer<typeof confirmEmailSchema.body>
>;
export type freezeSchemaType = Partial<z.infer<typeof freezeSchema.params>>;
