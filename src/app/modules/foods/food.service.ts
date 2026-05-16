import mongoose from "mongoose";
import QueryBuilder from "../../builder/QueryBuilder";
import { TFoodData } from "./food.interface";
import FoodModel from "./food.model";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../media-management";

const buildFoodPublicId = (payload: Pick<TFoodData, "foodName" | "food_origin">) =>
  `food-${payload.foodName}-${payload.food_origin}`;

const createFood = async (file: Express.Multer.File | undefined, payload: TFoodData) => {
  const session = await mongoose.startSession();
  let uploadedPublicIdForRollback: string | undefined;
  session.startTransaction();

  try {
    if (file?.buffer) {
      const uploaded = await uploadToCloudinary({
        fileBuffer: file.buffer,
        folder: "foods",
        publicId: buildFoodPublicId(payload),
      });
      payload.foodImage = uploaded.url;
      payload.foodImagePublicId = uploaded.public_id;
      uploadedPublicIdForRollback = uploaded.public_id;
    }

    const createdFood = await FoodModel.create([payload], { session });

    await session.commitTransaction();
    return { createdFood };
  } catch (error: any) {
    await session.abortTransaction();
    if (uploadedPublicIdForRollback) {
      await deleteFromCloudinary(uploadedPublicIdForRollback);
    }
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

  let relatedFoods = await FoodModel.find({
    _id: { $ne: id },
    $or: [
      {
        foodCategory: food.foodCategory,
        price: {
          $gte: food.price * 0.8,
          $lte: food.price * 1.2,
        },
      },
      { foodCategory: food.foodCategory },
      ...(food.tags && food.tags.length > 0
        ? [{ tags: { $in: food.tags } }]
        : []),
      ...(food.cuisine ? [{ cuisine: food.cuisine }] : []),
      { isVeg: food.isVeg },
    ],
  })
    .sort({ averageRating: -1, orders: -1 })
    .limit(6)
    .lean();

  let message = "All related foods";

  if (relatedFoods.length === 0) {
    relatedFoods = await FoodModel.find({ _id: { $ne: id } })
      .sort({ orders: -1, averageRating: -1 })
      .limit(6)
      .lean();
    message = "Top selling foods";
  }

  return { food, relatedFoods, message };
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
  const preFilter: Record<string, unknown> = {};

  if (query.isVeg !== undefined) preFilter.isVeg = query.isVeg === "true";
  if (query.isSpicy !== undefined) preFilter.isSpicy = query.isSpicy === "true";
  if (query.isGlutenFree !== undefined) preFilter.isGlutenFree = query.isGlutenFree === "true";
  if (query.bestseller !== undefined) preFilter.bestseller = query.bestseller === "true";

  if (query.minRating) {
    const minRating = parseFloat(query.minRating as string);
    if (!isNaN(minRating)) {
      preFilter.averageRating = { $gte: minRating };
    }
  }

  if (query.minPrice || query.maxPrice) {
    preFilter.price = {};
    if (query.minPrice) {
      (preFilter.price as any).$gte = parseFloat(query.minPrice as string);
    }
    if (query.maxPrice) {
      (preFilter.price as any).$lte = parseFloat(query.maxPrice as string);
    }
  }

  if (query.maxPrepTime) {
    const maxTime = parseInt(query.maxPrepTime as string);
    if (!isNaN(maxTime)) {
      preFilter.preparationTime = { $lte: maxTime };
    }
  }

  if (query.tags) {
    preFilter.tags = { $in: (query.tags as string).split(",") };
  }

  if (query.hasDiscount === "true") {
    preFilter.discountPercent = { $gt: 0 };
  }

  if (query.inStock === "true") {
    preFilter.quantity = { $gt: 0 };
  }

  if (query.cuisine) {
    preFilter.cuisine = query.cuisine;
  }

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

const updateFood = async (
  foodId: string,
  file: Express.Multer.File | undefined,
  payload: TFoodData,
) => {
  const session = await mongoose.startSession();
  let uploadedPublicIdForRollback: string | undefined;
  let oldPublicIdToDelete: string | undefined;
  session.startTransaction();

  try {
    const existing = await FoodModel.findById(foodId).session(session);
    if (!existing) {
      throw new Error("Food not found");
    }

    if (file?.buffer) {
      const uploaded = await uploadToCloudinary({
        fileBuffer: file.buffer,
        folder: "foods",
        publicId: buildFoodPublicId({
          foodName: payload.foodName ?? existing.foodName,
          food_origin: payload.food_origin ?? existing.food_origin,
        }),
      });
      payload.foodImage = uploaded.url;
      payload.foodImagePublicId = uploaded.public_id;
      uploadedPublicIdForRollback = uploaded.public_id;

      if (
        existing.foodImagePublicId &&
        existing.foodImagePublicId !== uploaded.public_id
      ) {
        oldPublicIdToDelete = existing.foodImagePublicId;
      }
    }

    const updatedFoodData = await FoodModel.findOneAndUpdate(
      { _id: foodId },
      { ...payload },
      { new: true, session }
    );

    await session.commitTransaction();

    if (oldPublicIdToDelete) {
      await deleteFromCloudinary(oldPublicIdToDelete);
    }

    return { updatedFoodData, img: updatedFoodData?.foodImage ?? "" };
  } catch (error: any) {
    await session.abortTransaction();
    if (uploadedPublicIdForRollback) {
      await deleteFromCloudinary(uploadedPublicIdForRollback);
    }
    console.error("Error updating food:", error.message);
    throw error;
  } finally {
    session.endSession();
  }
};

const deleteFood = async (foodId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const deletedFood = await FoodModel.findOneAndDelete(
      { _id: foodId },
      { session }
    );

    await session.commitTransaction();

    // DB commit succeeded → clean up the associated Cloudinary asset.
    if (deletedFood?.foodImagePublicId) {
      await deleteFromCloudinary(deletedFood.foodImagePublicId);
    }

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
    if (!food) throw new Error("Food not found");

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
