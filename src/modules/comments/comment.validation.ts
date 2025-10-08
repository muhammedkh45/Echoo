import * as z from "zod";
import { generalRules } from "../../utils/generalRules";
import { onModelEnum } from "../../DB/model/comment.model";

export enum ActionEnum {
  like = "like",
  unlike = "unlike",
}
export const createCommentSchema = {
  params: z.strictObject({
    postId: generalRules.id,
    commentId: generalRules.id.optional(),
  }),
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
      onModel: z.enum(onModelEnum),
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

export const freezeSchema = {
  params: z.strictObject({
    userId: generalRules.id.optional(),
    postId: generalRules.id.optional(),
    commentId: generalRules.id.optional(),
  }),
};
export type createCommentBodySchemaType = Partial<
  z.infer<typeof createCommentSchema.body>
>;
export type freezeCommentSchemaType = Partial<
  z.infer<typeof freezeSchema.params>
>;
export type createCommentParamsSchemaType = Partial<
  z.infer<typeof createCommentSchema.params>
>;
