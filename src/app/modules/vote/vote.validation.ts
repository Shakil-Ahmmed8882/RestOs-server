import { z } from 'zod';

export const createVoteValidationSchema = z.object({
  body: z.object({
    blog: z.string().nonempty("Blog ID is required"),
    voteType: z.enum(['upvote', 'downvote'], {
      errorMap: () => ({ message: 'Vote type must be either "upvote" or "downvote"' }),
    }),
  }),
});

export const updateVoteValidationSchema = z.object({
  body: z.object({
    voteType: z.enum(['upvote', 'downvote']).optional(),
  }),
});

export const VoteValidations = {
  createVoteValidationSchema,
  updateVoteValidationSchema,
};