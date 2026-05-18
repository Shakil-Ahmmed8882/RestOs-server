import { z } from "zod";

const updateMyProfileValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    bio: z.string().max(500).optional(),
    location: z.string().optional(),
    contactNumber: z.string().optional(),
    cuisinePreferences: z.array(z.string()).optional(),
    favoriteRestaurants: z.array(z.string()).optional(),
    dietaryRestrictions: z.array(z.string()).optional(),
    preferredMealTimes: z
      .array(z.enum(["Breakfast", "Lunch", "Dinner"]))
      .optional(),
    paymentMethods: z
      .array(z.enum(["Cash", "Credit Card", "Digital Wallet"]))
      .optional(),
    diningFrequency: z.enum(["Occasionally", "Frequently", "Rarely"]).optional(),
    socialMedia: z
      .object({
        instagram: z.string().optional(),
        facebook: z.string().optional(),
        twitter: z.string().optional(),
      })
      .optional(),
  }),
});

const preferenceField = z.enum([
  "cuisinePreferences",
  "favoriteRestaurants",
  "dietaryRestrictions",
  "preferredMealTimes",
  "paymentMethods",
]);

const updatePreferenceValidationSchema = z.object({
  body: z.object({
    field: preferenceField,
    action: z.enum(["add", "remove", "replace"]),
    values: z.array(z.string()).min(0),
  }),
});

export const profileValidations = {
  updateMyProfileValidationSchema,
  updatePreferenceValidationSchema,
};
