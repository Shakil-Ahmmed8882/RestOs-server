"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderValidations = void 0;
const zod_1 = require("zod");
const createOrderZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        food: zod_1.z.string({ required_error: "Food ID is required" }),
        user: zod_1.z.string({ required_error: "User ID is required" }),
        quantity: zod_1.z.number({ required_error: "Quantity is required" }).min(1),
        totalPrice: zod_1.z.number({ required_error: "Total Price is required" }).min(1)
    }),
});
const updateOrderZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(["pending", "completed", "canceled"]).optional(),
    }),
});
exports.orderValidations = {
    createOrderZodSchema,
    updateOrderZodSchema,
};
