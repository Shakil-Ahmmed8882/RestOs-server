export interface TReview {
    customer_name: string;
    rating: number;
    comment: string;
    date: string;
  }
  
  export interface TFoodData {
    foodName: string;
    status?: string;
    foodImage: string;
    foodCategory: string;
    price: number;
    discountPercent?: number;
    orders: number;
    quantity: number;
    made_by: string;
    food_origin: string;
    description: string;
    isVeg?: boolean;
    tags?: string[];
    preparationTime?: number;
    reviews: TReview[];
  }
  
  