"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoteValidations = exports.updateVoteValidationSchema = exports.createVoteValidationSchema = void 0;
const zod_1 = require("zod");
exports.createVoteValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        blog: zod_1.z.string().nonempty("Blog ID is required"),
        voteType: zod_1.z.enum(['upvote', 'downvote'], {
            errorMap: () => ({ message: 'Vote type must be either "upvote" or "downvote"' }),
        }),
    }),
});
exports.updateVoteValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        voteType: zod_1.z.enum(['upvote', 'downvote']).optional(),
    }),
});
exports.VoteValidations = {
    createVoteValidationSchema: exports.createVoteValidationSchema,
    updateVoteValidationSchema: exports.updateVoteValidationSchema,
};
