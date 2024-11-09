import { z } from "zod";
const createUserValidationSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "User name is required" }),
    email: z.string({ required_error: " User email is required" }),
    password: z.string().optional(),
    photo: z.string().optional(),
  }),
});

const updateUserValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(), 
    photo: z.string().optional(),  
    bio: z.string().optional(), 
    location: z.string().optional(), 
    cuisinePreferences: z.array(z.string()).optional(), 
    favoriteRestaurants: z.array(z.string()).optional(), 
    dietaryRestrictions: z.array(z.string()).optional(), 
    contactNumber: z.string().optional(), 
    socialMedia: z
      .object({
        instagram: z.string().optional(),
        facebook: z.string().optional(),
        twitter: z.string().optional(),
      })
      .optional(), 
    diningFrequency: z.string().optional(), 
    preferredMealTimes: z.array(z.string()).optional(), 
    paymentMethods: z.array(z.string()).optional(), 
  }),
})
export const userValidations = {
  createUserValidationSchema,
  updateUserValidationSchema,
};
