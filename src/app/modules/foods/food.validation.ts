import { z } from "zod";

const reviewSchema = z.object({
  customer_name: z.string(),
  rating: z.number().min(0).max(5),
  comment: z.string(),
  date: z.string(),
});

const createFoodValidationSchema = z.object({
  body: z.object({
    foodName: z.string(),
    status: z.string().optional(),
    foodCategory: z.string(),
    price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Price must be a positive number",
    }),
    discountPercent: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100, {
      message: "Discount percent must be between 0 and 100",
    }).optional(),
    quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Quantity must be a non-negative number",
    }),
    made_by: z.string(),
    food_origin: z.string(),
    description: z.string(),
    isVeg: z.boolean().optional(),
    isSpicy: z.boolean().optional(),
    isGlutenFree: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    preparationTime: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Preparation time must be a non-negative number",
    }).optional(),
    cuisine: z.string().optional(),
    bestseller: z.boolean().optional(),
  }),
});

const foodUpdateValidationSchema = z.object({
  body: z.object({
    foodName: z.string().optional(),
    status: z.string().optional(),
    foodImage: z.string().url().optional(),
    foodCategory: z.string().optional(),
    price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Price must be a positive number",
    }).optional(),
    discountPercent: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100, {
      message: "Discount percent must be between 0 and 100",
    }).optional(),
    orders: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Orders must be a non-negative number",
    }).optional(),
    quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Quantity must be a non-negative number",
    }).optional(),
    made_by: z.string().optional(),
    food_origin: z.string().optional(),
    description: z.string().optional(),
    isVeg: z.boolean().optional(),
    isSpicy: z.boolean().optional(),
    isGlutenFree: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    preparationTime: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Preparation time must be a non-negative number",
    }).optional(),
    cuisine: z.string().optional(),
    bestseller: z.boolean().optional(),
    reviews: z.array(reviewSchema).optional(),
  }),
});

const addReviewValidationSchema = z.object({
  body: z.object({
    customer_name: z.string().min(1),
    rating: z.number().min(0).max(5),
    comment: z.string().min(1),
    date: z.string(),
  }),
});

export const foodValidations = {
  createFoodValidationSchema,
  foodUpdateValidationSchema,
  addReviewValidationSchema,
};
