import * as z from "zod";
import { AllowCommentEnum, AvailabilityEnum } from "../../DB/model/post.model";
import mongoose, { Schema } from "mongoose";
import { generalRules } from "../../utils/generalRules";

export enum ActionEnum {
  like = "like",
  unlike = "unlike",
}
export const createPostSchema = {
  body: z
    .strictObject({
      content: z.string().min(5).max(2000).optional(),
      attachments: z.array(generalRules.file).max(2).optional(),
      assetFolderId: z.string().optional(),
      tags: z
        .array(generalRules.id)
        .refine(
          (data) => {
            return new Set(data).size === data.length;
          },
          { message: "Duplication is not allowed" }
        )
        .optional(),
      likes: z.array(generalRules.id).optional(),
      allowComment: z
        .enum(AllowCommentEnum)
        .default(AllowCommentEnum.allow)
        .optional(),
      availability: z
        .enum(AvailabilityEnum)
        .default(AvailabilityEnum.public)
        .optional(),
    })
    .superRefine((data, ctx) => {
      if (!data?.content && !data.attachments?.length) {
        ctx.addIssue({
          code: "custom",
          path: ["Content"],
          message: "content or attachment is required",
        });
      }
    }),
};

export const postLikeSchema = {
  params: z.strictObject({
    postId: generalRules.id,
  }),
  query: z.strictObject({
    action: z.enum(ActionEnum).default(ActionEnum.like),
  }),
};
export type createPostSchemaType = Partial<
  z.infer<typeof createPostSchema.body>
>;
export type PostLikeSchemaType = Partial<z.infer<typeof postLikeSchema.params>>;
export type likePostQueryDTO = Partial<z.infer<typeof postLikeSchema.query>>;
