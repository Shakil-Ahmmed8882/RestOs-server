import { Error, startSession } from "mongoose";
import QueryBuilder from "../../builder/QueryBuilder";
import { TOrderFood } from "./order.interface";
import OrdersModel from "./order.model";
import UserModel from "../user/user.model";
import { TUser } from "../user/user.interface";

/**
 * Creates an order and associates it with a user.
 * Uses a transaction to ensure both operations succeed or fail together.
 *
 * @param payload - The order data to be created.
 * @returns The created order.
 * @throws Will throw an error if the user is not found or if any database operation fails.
 */
const createOrder = async (payload: TOrderFood) => {
  // Start a new session for the transaction
  const session = await startSession();
  session.startTransaction();

  try {
    const product = await OrdersModel.findOne({ foodId: payload.foodId });

    // check no duplicate order
    if (product) {
      throw new Error("Opps! this product is already ordered");
    }

    // Find the user by email and
    //include the session in the query
    const user = await UserModel.findOne({ email: payload.email }).session(
      session
    );
    if (!user) {
      throw new Error("User not found!");
    }

    // Add the order ID to the user's orders and save the user
    user.orders.push(payload.foodId);
    await user.save({ session });

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
  const result = OrdersModel.findById(id);
  return result;
};

const getAllOrders = async (query: Record<string, unknown>) => {
  const result = new QueryBuilder(OrdersModel.find(), query)
    .search(["foodName"])
    .filter()
    .sort()
    .paginate();
  return await result.modelQuery;
};

export const OrderServiices = {
  createOrder,
  getSingleOrder,
  getAllOrders,
};
