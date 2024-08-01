export type TOrderFood = {
    _id: string
    foodName: string;
    status: string;
    foodImage: string;
    foodCategory: string;
    price: number; 
    orders: number; 
    quantity: number; 
    made_by: string;
    food_origin: string;
    description: string;
    reviews: any[]; 
    orderedDate?: string; 
    email?: string; 
  };
  