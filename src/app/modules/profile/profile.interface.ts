export type TProfileTab = "blogs" | "saved" | "orders" | "comments";

export interface IProfileOverview {
  user: {
    _id: string;
    name: string;
    email: string;
    photo?: string;
    bio?: string;
    role: string;
    status: string;
    location?: string;
    contactNumber?: string;
    socialMedia?: {
      instagram?: string;
      facebook?: string;
      twitter?: string;
    };
    diningFrequency?: string;
    cuisinePreferences?: string[];
    favoriteRestaurants?: string[];
    dietaryRestrictions?: string[];
    preferredMealTimes?: string[];
    paymentMethods?: string[];
    createdAt?: Date;
  };
  stats: {
    blogsCount: number;
    approvedBlogsCount: number;
    pendingBlogsCount: number;
    savedCount: number;
    ordersCount: number;
    commentsCount: number;
    totalUpvotesReceived: number;
  };
  highlights: {
    cuisinePreferences: string[];
    dietaryRestrictions: string[];
    preferredMealTimes: string[];
  };
  recommendations: Array<{
    _id: string;
    name: string;
    photo?: string;
    bio?: string;
  }>;
}
