// user.interface.ts
export interface TUser {
  name: string;
  email: string;
  bio?: string;
  photo?: string;
  password?: string;
  status: string;
  role: string;
  location?: string;
  cuisinePreferences?: string[];       // Preferred cuisines
  favoriteRestaurants?: string[];      // List of favorite restaurants
  dietaryRestrictions?: string[];      // E.g., "Vegan", "Gluten-Free"
  contactNumber?: string;
  socialMedia?: socialMedia,
  diningFrequency?: string;            // E.g., "Occasionally", "Frequently"
  preferredMealTimes?: string[];       // E.g., "Breakfast", "Lunch", "Dinner"
  paymentMethods?: string[];           // Preferred payment methods
}


export type socialMedia =  {
  instagram?: string;
  facebook?: string;
  twitter?: string;
};