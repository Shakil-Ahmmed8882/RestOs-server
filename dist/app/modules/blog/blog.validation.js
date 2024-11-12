"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blogValidations = void 0;
const zod_1 = require("zod");
const createBlogValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string({ required_error: "Blog title is required" }),
        category: zod_1.z.string({ required_error: "Blog category is required" }),
        tags: zod_1.z.array(zod_1.z.string({ required_error: "tags are required" })),
        description: zod_1.z.string({ required_error: "Blog description is required" }),
        instructions: zod_1.z.array(zod_1.z.string({ required_error: "ingredients are required" })),
        author: zod_1.z.object({
            user: zod_1.z.string({ required_error: "Author ID is required" }),
            name: zod_1.z.string({ required_error: "Author name is required" }),
        }),
    }),
});
const updateBlogValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().optional(),
        category: zod_1.z.string().optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
        description: zod_1.z.string().optional(),
        content: zod_1.z.string().optional(),
        status: zod_1.z.enum(["pending", "approved", "test-approved"]).optional(),
    }),
});
exports.blogValidations = {
    createBlogValidationSchema,
    updateBlogValidationSchema,
};
