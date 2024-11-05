

import { z } from "zod";
const createUserValidationSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "User name is required" }),
    email: z.string({ required_error: " User email is required" }),
    password: z.string().optional(),
    photo: z.string().optional(),
    role: z.string({ required_error: "User role is required" }),
  }),
});

const updateUserValidationSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "name is required" }).optional(),
    email: z.string({ required_error: " email is required" }).optional(),
    role: z.string({ required_error: "role is required" }).optional(),
    photo: z.string().optional(),

  }),
});
export const userValidations = {
  createUserValidationSchema,
  updateUserValidationSchema,
};
