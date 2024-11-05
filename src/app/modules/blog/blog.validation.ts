import { z } from "zod";

const createBlogValidationSchema = z.object({
  body: z.object({
    title: z.string({ required_error: "Blog title is required" }),
    category: z.string({ required_error: "Blog category is required" }),
    tags: z.array(z.string({required_error: "tags are required"})),
    description: z.string({ required_error: "Blog description is required" }),
    instructions: z.array(z.string({required_error: "ingredients are required"})),
    author: z.object({
      user: z.string({ required_error: "Author ID is required" }),
      name: z.string({ required_error: "Author name is required" }),
    }),
  }),
});

const updateBlogValidationSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    description: z.string().optional(),
    content: z.string().optional(),
    status: z.enum(["pending", "approved", "test-approved"]).optional(),
  }),
});

export const blogValidations = {
  createBlogValidationSchema,
  updateBlogValidationSchema,
};


