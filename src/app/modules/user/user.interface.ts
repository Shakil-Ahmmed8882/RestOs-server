// user.interface.ts
export interface TUser {
  _id?: string;
  name: string;
  email: string;
  bio?: string;
  photo?: string;
  photoPublicId?: string;
  isDeleted?: boolean;
  password?: string;
  status: string;
  role: string;
  location?: string;
  cuisinePreferences?: string[];
  favoriteRestaurants?: string[];
  dietaryRestrictions?: string[];
  contactNumber?: string;
  socialMedia?: socialMedia;
  diningFrequency?: string;
  preferredMealTimes?: string[];
  paymentMethods?: string[];
}


export type socialMedia =  {
  instagram?: string;
  facebook?: string;
  twitter?: string;
};