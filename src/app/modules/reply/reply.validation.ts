import { z } from "zod";

export const replyCommentValidationSchema = z.object({
  body: z.object({
    comment: z.string(),
  }),
});
