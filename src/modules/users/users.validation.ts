import * as z from "zod";
import { GenderType, RoleType } from "../../DB/model/user.model";
export const signUpSchema = {
  body: z
    .strictObject({
      userName: z.string().min(3).max(15).trim(),
      email: z.email(),
      password: z
        .string()
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        ),
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

export type signUpSchemaType = Partial<z.infer<typeof signUpSchema.body>>;
