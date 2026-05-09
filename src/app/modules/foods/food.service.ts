import mongoose from "mongoose";
import QueryBuilder from "../../builder/QueryBuilder";
import { TFoodData } from "./food.interface";
import FoodModel from "./food.model";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";

const createFood = async (file: any, payload: TFoodData) => {
  const session = await mongoose.startSession();

  // Begin transaction
  session.startTransaction();

  try {
    if (file) {
      const imageName = `${payload.foodName}_${payload.food_origin}`;
      const path = file.path;

      // Send image to cloud storage and retrieve URL
      const { secure_url } = await sendImageToCloudinary(imageName, path);
      payload.foodImage = secure_url as string;
    }

    const createdFood = await FoodModel.create([payload], {
      new: true,
      session,
    });

    await session.commitTransaction();
    return { createdFood };
  } catch (error: any) {
    await session.abortTransaction();
    console.error("Error creating food:", error.message);
    throw error;
  } finally {
    session.endSession();
  }
};

const getSingleFood = async (id: string) => {
  const food = await FoodModel.findById(id);

  if (!food) {
    return { food: null, relatedFoods: [], message: "" };
  }

  // Get related foods based on priority matching
  let relatedFoods = await FoodModel.find({
    _id: { $ne: id },
    $or: [
      // Same category with similar price (±20%)
      {
        foodCategory: food.foodCategory,
        price: {
          $gte: food.price * 0.8,
          $lte: food.price * 1.2,
        },
      },
      // Same category
      {
        foodCategory: food.foodCategory,
      },
      // Matching tags
      ...(food.tags && food.tags.length > 0
        ? [{ tags: { $in: food.tags } }]
        : []),
      // Same cuisine
      ...(food.cuisine ? [{ cuisine: food.cuisine }] : []),
      // Similar dietary preferences
      {
        isVeg: food.isVeg,
      },
    ],
  })
    .sort({ averageRating: -1, orders: -1 })
    .limit(6)
    .lean();

  let message = "All related foods";

  // If no related foods found, get top-selling foods
  if (relatedFoods.length === 0) {
    relatedFoods = await FoodModel.find({ _id: { $ne: id } })
      .sort({ orders: -1, averageRating: -1 })
      .limit(6)
      .lean();
    message = "Top selling foods";
  }

  return {
    food,
    relatedFoods,
    message,
  };
};

const getTopSellingFood = async (query: Record<string, unknown>) => {
  const result = new QueryBuilder(FoodModel.find(), query)
    .search(["foodName"])
    .filter()
    .sort()
    .paginate();

  return await result.modelQuery;
};

const getAllFoods = async (query: Record<string, unknown>) => {
  // Build comprehensive pre-filters
  const preFilter: Record<string, unknown> = {};

  // Boolean filters
  if (query.isVeg !== undefined) preFilter.isVeg = query.isVeg === "true";
  if (query.isSpicy !== undefined) preFilter.isSpicy = query.isSpicy === "true";
  if (query.isGlutenFree !== undefined) preFilter.isGlutenFree = query.isGlutenFree === "true";
  if (query.bestseller !== undefined) preFilter.bestseller = query.bestseller === "true";

  // Rating filter
  if (query.minRating) {
    const minRating = parseFloat(query.minRating as string);
    if (!isNaN(minRating)) {
      preFilter.averageRating = { $gte: minRating };
    }
  }

  // Price range filter
  if (query.minPrice || query.maxPrice) {
    preFilter.price = {};
    if (query.minPrice) {
      (preFilter.price as any).$gte = parseFloat(query.minPrice as string);
    }
    if (query.maxPrice) {
      (preFilter.price as any).$lte = parseFloat(query.maxPrice as string);
    }
  }

  // Preparation time filter
  if (query.maxPrepTime) {
    const maxTime = parseInt(query.maxPrepTime as string);
    if (!isNaN(maxTime)) {
      preFilter.preparationTime = { $lte: maxTime };
    }
  }

  // Tags/ingredients filter
  if (query.tags) {
    preFilter.tags = { $in: (query.tags as string).split(",") };
  }

  // Discount filter
  if (query.hasDiscount === "true") {
    preFilter.discountPercent = { $gt: 0 };
  }

  // Stock availability filter
  if (query.inStock === "true") {
    preFilter.quantity = { $gt: 0 };
  }

  // Cuisine filter
  if (query.cuisine) {
    preFilter.cuisine = query.cuisine;
  }

  // Status filter
  if (query.status) {
    preFilter.status = query.status;
  }

  const foodQuery = new QueryBuilder(
    FoodModel.find(Object.keys(preFilter).length ? preFilter : {}),
    query
  )
    .search(["foodName", "description", "foodCategory", "tags"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await foodQuery.modelQuery;
  const meta = await foodQuery.countTotal();
  return { data: result, meta };
};

const updateFood = async (foodId: string, file: any, payload: TFoodData) => {
  const session = await mongoose.startSession();

  // Begin transaction
  session.startTransaction();

  try {
    let img: string = "";
    if (file) {
      const imageName = `${payload.foodName}_${payload.food_origin}`;
      const path = file.path;

      // Send image to cloud storage and retrieve URL
      const { secure_url } = await sendImageToCloudinary(imageName, path);
      payload.foodImage = secure_url as string;
      img = secure_url as string;
    }

    const updatedFoodData = await FoodModel.findOneAndUpdate(
      { _id: foodId },
      { ...payload },
      { new: true, session }
    );

    await session.commitTransaction();
    return { updatedFoodData, img };
  } catch (error: any) {
    await session.abortTransaction();
    console.error("Error updating food:", error.message);
    throw error;
  } finally {
    session.endSession();
  }
};

const deleteFood = async (foodId: string) => {
  const session = await mongoose.startSession();

  // Begin transaction
  session.startTransaction();

  try {
    const deletedFood = await FoodModel.findOneAndDelete(
      { _id: foodId },
      { new: true, session }
    );

    await session.commitTransaction();
    return { deletedFood };
  } catch (error: any) {
    await session.abortTransaction();
    console.error("Error Deleting a food:", error.message);
    throw error;
  } finally {
    session.endSession();
  }
};

const addReview = async (foodId: string, reviewData: any) => {
  const session = await mongoose.startSession();

  session.startTransaction();

  try {
    const food = await FoodModel.findById(foodId, {}, { session });

    if (!food) {
      throw new Error("Food not found");
    }

    food.reviews.push(reviewData);

    const updatedFood = await food.save({ session });

    await session.commitTransaction();
    return updatedFood;
  } catch (error: any) {
    await session.abortTransaction();
    console.error("Error adding review:", error.message);
    throw error;
  } finally {
    session.endSession();
  }
};

export const foodServices = {
  createFood,
  getSingleFood,
  getTopSellingFood,
  getAllFoods,
  updateFood,
  deleteFood,
  addReview,
};
