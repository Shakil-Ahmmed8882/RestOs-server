import mongoose, { Error, Schema, startSession } from "mongoose";
import QueryBuilder from "../../builder/QueryBuilder";
import OrdersModel from "./order.model";
import UserModel from "../user/user.model";
import { TOrder } from "./order.interface";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import FoodModel from "../foods/food.model";
import { USER_STATUS } from "../../constants";

/**
 * Creates an order and associates it with a user.
 * Uses a transaction to ensure both operations succeed or fail together.
 *
 * @param payload - The order data to be created.
 * @returns The created order.
 * @throws Will throw an error if the user is not found or if any database operation fails.
 */
const createOrder = async (payload: TOrder) => {
  // Start a new session for the transaction
  const session = await startSession();
  session.startTransaction();

  try {
    // Find the user by email and
    //include the session in the query
    const user = await UserModel.findById(payload.user).session(session);
    if (!user) {
      throw new Error("User not found!");
    }
    if (user.status !== USER_STATUS.ACTIVE) {
      throw new Error("User not active!");
    }

    const food = await FoodModel.findById(payload.food).session(session);
    if (!food) {
      throw new Error("Food not found!");
    }

    const products = await OrdersModel.findOne({
      food: payload.food,
      user: payload.user,
    });

    // check no duplicate order
    if (products) {
      throw new Error("Opps! this product is already ordered");
    }

    // Create the order in the Orders collection
    const result = await OrdersModel.create([payload], { session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    return result;
  } catch (error) {
    // Abort the transaction in case of error
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    throw error;
  }
};
const getSingleOrder = async (id: string) => {
  const result = OrdersModel.findById(id).populate("food").populate("user");
  return result;
};
const getAllOrders = async (query: Record<string, unknown>) => {
  const orderQuery = new QueryBuilder(OrdersModel.find(), query)
    .search(["foodName"])
    .filter()
    .sort()
    .paginate();

  const meta = await orderQuery.countTotal();
  const result = await orderQuery.modelQuery.populate("food").populate("user");

  return {
    meta,
    result,
  };
};

const deleteOrder = async (orderId: string) => {
  const session = await startSession();
  session.startTransaction();

  try {
    
    const orderDeletionResult = await OrdersModel.deleteOne(
      { _id:orderId},
      {
        session: session,
      }
    );

    if (!orderDeletionResult) {
      throw new Error("Order not found.");
    }

    await session.commitTransaction();
    return orderDeletionResult;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Retrieves the order summary for a specific user.
 *
 * @param userId - The email of the user for whom to retrieve the order summary.
 * @returns An object containing the total purchase price and total order count.
 */
const getOrderSummaryOfSingleUser = async (userId: string) => {
  // Fetch orders associated with the user

  const orders = await OrdersModel.find({
    user: userId,
  });

  if (!orders) {
    throw new AppError(httpStatus.NOT_FOUND, "Opps! order is not found");
  }
  // Calculate totals
  const totalPurchasePrice = orders
    .filter((order) => order.status === "confirmed")
    .reduce((acc, order) => acc + order.totalPrice, 0);

  const totalPurchaseCount = orders.filter(
    (order) => order.status === "confirmed"
  ).length;

  const totalOrderPrice = orders
    .reduce((acc, order) => acc + order.totalPrice, 0)
    .toFixed(2);

  const totalOrderCount = orders.length;

  return {
    totalPurchasePrice,
    totalPurchaseCount,
    totalOrderPrice,
    totalOrderCount,
  };
};

export const OrderServiices = {
  createOrder,
  getSingleOrder,
  getAllOrders,
  deleteOrder,
  getOrderSummaryOfSingleUser,
};
