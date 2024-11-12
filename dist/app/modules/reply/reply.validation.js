"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replyCommentValidationSchema = void 0;
const zod_1 = require("zod");
exports.replyCommentValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        comment: zod_1.z.string(),
    }),
});
