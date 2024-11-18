import { z } from "zod";

const createOrderZodSchema = z.object({
  body: z.object({
    food: z.string({ required_error: "Food ID is required" }),
    user: z.string({ required_error: "User ID is required" }),
    quantity: z.number({ required_error: "Quantity is required" }).min(1),
    totalPrice: z.number({ required_error: "Total Price is required" }).min(1)
  }),
});

const updateOrderZodSchema = z.object({
  body: z.object({
    status: z.enum(["pending", "confirmed", "canceled"]).optional(),
  }),
});

export const orderValidations = {
  createOrderZodSchema,
  updateOrderZodSchema,
};
