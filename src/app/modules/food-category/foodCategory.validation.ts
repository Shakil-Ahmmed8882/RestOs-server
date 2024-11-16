import { z } from "zod";

// Validation schema for creating a category
const createFoodCategoryValidationSchema = z.object({
  body: z.object({
    name: z.string(),
    description: z.string().optional(),
  }),
});

const updateFoodCategoryValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const foodCategoryValidations = {
  createFoodCategoryValidationSchema,
  updateFoodCategoryValidationSchema,
};
