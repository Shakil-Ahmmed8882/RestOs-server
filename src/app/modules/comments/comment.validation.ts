import { z } from 'zod';

export const createCommentValidationSchema = z.object({
  body: z.object({
    blog: z.string().nonempty('blog ID is required'),
    user: z.string().nonempty('user ID is required'),
    comment: z.string().nonempty('comment is required'),
  }),
});

export const updateCommentValidationSchema = z.object({
  body: z.object({
    comment: z.string().optional(),
  }),
});
