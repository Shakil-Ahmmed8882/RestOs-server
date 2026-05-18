import { z } from "zod";

const toBoolean = z.preprocess((val) => {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val.toLowerCase() === "true";
  return undefined;
}, z.boolean().optional());

export const createCommentValidationSchema = z.object({
  body: z.object({
    blog: z.string().nonempty("blog ID is required"),
    comment: z.string().nonempty("comment is required"),
  }),
});

export const updateCommentValidationSchema = z.object({
  body: z.object({
    comment: z.string().optional(),
    removeImage: toBoolean,
  }),
});

