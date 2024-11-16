// Interface for FoodCategory
export interface TFoodCategory extends Document {
  name: string;
  description?: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}