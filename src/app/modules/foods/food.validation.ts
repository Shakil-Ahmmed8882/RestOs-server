import { z } from "zod";

const reviewSchema = z.object({
  customer_name: z.string(),
  rating: z.number().min(0).max(5),
  comment: z.string(),
  date: z.string(),
});

const foodValidationSchema = z.object({
  body: z.object({
    foodName: z.string(),
    status: z.string().optional(),
    foodImage: z.string().url(),
    foodCategory: z.string(),
    price: z.number().positive(),
    orders: z.number().nonnegative(),
    quantity: z.number().nonnegative(),
    made_by: z.string(),
    food_origin: z.string(),
    description: z.string(),
    reviews: z.array(reviewSchema),
  }),
});



export const foodValidations = {
    foodValidationSchema
}