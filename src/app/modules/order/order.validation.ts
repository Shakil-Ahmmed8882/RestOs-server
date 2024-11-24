import { z } from "zod";


const cartItemSchema = z.object({
  food: z.string({ required_error: "Food ID is required" }),
  user: z.string({ required_error: "User ID is required" }),
  foodName: z.string({ required_error: "Food name is required" }),
  quantity: z.number({ required_error: "Quantity is required" }).min(1, "Quantity must be at least 1"),
  price: z.number({ required_error: "Price is required" }).min(0, "Price cannot be negative"),
  totalPrice: z.number({ required_error: "Total Price is required" }).min(0, "Total price cannot be negative"),
});

const createOrderZodSchema = z.object({
  body: z.object({
    cartItems: z.array(cartItemSchema).nonempty({ message: "Cart items cannot be empty" }),
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
