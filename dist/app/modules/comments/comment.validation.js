"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCommentValidationSchema = exports.createCommentValidationSchema = void 0;
const zod_1 = require("zod");
exports.createCommentValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        blog: zod_1.z.string().nonempty("blog ID is required"),
        comment: zod_1.z.string().nonempty("comment is required"),
    }),
});
exports.updateCommentValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        comment: zod_1.z.string(),
    }),
});
