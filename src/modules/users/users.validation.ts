import * as z from "zod";
export const signUpSchema = {
  body: z
    .strictObject({
      name: z.string().min(3).max(15).trim(),
      email: z.email(),
      password: z.string(),
      cPassword: z.string(),
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
