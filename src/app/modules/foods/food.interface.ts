export interface TReview {
    customer_name: string;
    rating: number;
    comment: string;
    date: string;
  }
  
  export interface TFoodData {
    foodName: string;
    status?: string; // Optional field
    foodImage: string;
    foodCategory: string;
    price: number;
    orders: number;
    quantity: number;
    made_by: string;
    food_origin: string;
    description: string;
    reviews: TReview[];
  }
  
  