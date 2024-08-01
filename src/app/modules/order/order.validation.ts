import { z } from "zod";

const createOrderFood = z.object({
  body: z.object({
    foodId: z.string({ required_error: "food id is required" }),
    foodName: z.string({ required_error: "Food name is required" }),
    foodImage: z.string({ required_error: "Food image required" }),
    price: z.number({ required_error: "Food price is required" }),
    made_by: z.string({ required_error: "mady by (chef) is required" }),
    email: z.string({ required_error: "User email is required" }),
  }),
});
const updateOrderFood = z.object({
  body: z.object({
    foodId: z.string().optional(),
    foodName: z.string().optional(),
    foodImage: z.string().optional(),
    price: z.number().optional(),
    made_by: z.string().optional(),
    email: z.string().optional(),
  }),
});

export const orderFoodValidations = {
  createOrderFood,
  updateOrderFood,
};
