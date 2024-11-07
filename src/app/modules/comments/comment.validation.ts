import { z } from "zod";

export const createCommentValidationSchema = z.object({
  body: z.object({
    blog: z.string().nonempty("blog ID is required"),
    comment: z.string().nonempty("comment is required"),
  }),
});

export const updateCommentValidationSchema = z.object({
  body: z.object({
    comment: z.string(),
  }),
});

