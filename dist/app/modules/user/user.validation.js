"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userValidations = void 0;
const zod_1 = require("zod");
const createUserValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: "User name is required" }),
        email: zod_1.z.string({ required_error: " User email is required" }),
        password: zod_1.z.string().optional(),
        photo: zod_1.z.string().optional(),
    }),
});
const updateUserValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().optional(),
        photo: zod_1.z.string().optional(),
        bio: zod_1.z.string().optional(),
        location: zod_1.z.string().optional(),
        cuisinePreferences: zod_1.z.array(zod_1.z.string()).optional(),
        favoriteRestaurants: zod_1.z.array(zod_1.z.string()).optional(),
        dietaryRestrictions: zod_1.z.array(zod_1.z.string()).optional(),
        contactNumber: zod_1.z.string().optional(),
        socialMedia: zod_1.z
            .object({
            instagram: zod_1.z.string().optional(),
            facebook: zod_1.z.string().optional(),
            twitter: zod_1.z.string().optional(),
        })
            .optional(),
        diningFrequency: zod_1.z.string().optional(),
        preferredMealTimes: zod_1.z.array(zod_1.z.string()).optional(),
        paymentMethods: zod_1.z.array(zod_1.z.string()).optional(),
    }),
});
exports.userValidations = {
    createUserValidationSchema,
    updateUserValidationSchema,
};
