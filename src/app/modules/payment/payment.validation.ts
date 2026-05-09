import { z } from "zod";

export const paymentValidations = {
  initiatePaymentSchema: z.object({
    body: z.object({
      orderId: z.string().min(1, "Order ID is required"),
    }),
  }),

  verifyPaymentSchema: z.object({
    body: z.object({
      transactionId: z.string().min(1, "Transaction ID is required"),
      status: z.enum(["VALID", "INVALID"]),
      val_id: z.string().optional(),
      amount: z.number().optional(),
      currency: z.string().optional(),
    }),
  }),
};
