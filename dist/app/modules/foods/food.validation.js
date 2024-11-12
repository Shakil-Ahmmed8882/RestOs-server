"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.foodValidations = void 0;
const zod_1 = require("zod");
const reviewSchema = zod_1.z.object({
    customer_name: zod_1.z.string(),
    rating: zod_1.z.number().min(0).max(5),
    comment: zod_1.z.string(),
    date: zod_1.z.string(),
});
const foodValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        foodName: zod_1.z.string(),
        status: zod_1.z.string().optional(),
        foodImage: zod_1.z.string().url(),
        foodCategory: zod_1.z.string(),
        price: zod_1.z.number().positive(),
        orders: zod_1.z.number().nonnegative(),
        quantity: zod_1.z.number().nonnegative(),
        made_by: zod_1.z.string(),
        food_origin: zod_1.z.string(),
        description: zod_1.z.string(),
        reviews: zod_1.z.array(reviewSchema),
    }),
});
exports.foodValidations = {
    foodValidationSchema
};
