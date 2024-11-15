import { z } from "zod";

export const replyCommentValidationSchema = z.object({
  body: z.object({
    replyText: z.string(),
    blogId: z.string(),
  }),
});
