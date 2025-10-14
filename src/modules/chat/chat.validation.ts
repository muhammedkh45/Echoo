import * as z from "zod";
import { generalRules } from "../../utils/generalRules";

export const getChatSchema = {
  params: z.object({
    userId: generalRules.id,
  }),
};

export const createGroupChatSchema = {
  body: z.object({
    group: z.string().min(1).optional(),
    groupImage: z.string().optional(),
    participants: z.array(generalRules.id).min(1),
  }),
};

export const getGroupChatSchema = {
  params: z.object({
    groupId: generalRules.id,
  }),
};

