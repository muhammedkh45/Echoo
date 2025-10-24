import * as z from "zod";
import { GenderType, RoleType } from "../../DB/model/user.model";
import { Types } from "mongoose";
import { generalRules } from "../../utils/generalRules";
import { FriendRequestEnum } from "../../DB/model/friendRequest.model";
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
export const confirmNewEmailSchema = {
  body: z
    .strictObject({
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
  params: z.strictObject({
    userId: generalRules.id.optional(),
  }),
};

export const actionOnReqSchema = {
  params: z.strictObject({ requestId: z.string() }),
  query: z.strictObject({ action: z.enum(FriendRequestEnum) }),
};
export const updatePasswordSchema = {
  body: z
    .strictObject({
      oldPasswod: z
        .string()
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        ),
      newPassword: z
        .string()
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        ),
      cPassword: z
        .string()
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        ),
    })
    .superRefine((data, ctx) => {
      if (data.oldPasswod === data.newPassword) {
        ctx.addIssue({
          code: "custom",
          message: "Old password can not match new Password",
        });
      }
      if (data.newPassword !== data.cPassword) {
        ctx.addIssue({
          code: "custom",
          message: "Not matching",
        });
      }
    }),
};
export const updateProfileSchema = {
  body: z
    .strictObject({
      userName: z.string().min(3).max(15).trim().optional(),
      age: z.number().min(13).optional(),
      address: z
        .string()
        .regex(/^[0-9a-zA-Z\s,.-]{5,100}$/)
        .optional(),
      phone: z
        .string()
        .regex(/^\+?[0-9]{1,3}?[-.\s]?(\(?\d{1,4}\)?[-.\s]?)*\d{1,4}$/)
        .optional(),
      gender: z.enum(GenderType).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update",
    }),
};
export const updateEmailSchema = {
  body: z
    .strictObject({
      newEmail: generalRules.email,
      password: generalRules.password,
    })
    .refine((data) => data.newEmail && data.password, {
      message: "Both new email and current password are required",
    }),
};
export const getOneUserSchema = z
  .strictObject({
    id: generalRules.id,
  })
  .required();
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
export type updateProfileSchemaType = z.infer<typeof updateProfileSchema.body>;
export type updateEmailSchemaType = z.infer<typeof updateEmailSchema.body>;
