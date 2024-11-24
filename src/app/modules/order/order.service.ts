import { Error, startSession } from "mongoose";
import QueryBuilder from "../../builder/QueryBuilder";
import OrdersModel from "./order.model";
import UserModel from "../user/user.model";
import { TOrder } from "./order.interface";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import FoodModel from "../foods/food.model";

/**
 * Creates an order and associates it with a user.
 * Uses a transaction to ensure both operations succeed or fail together.
 *
 * @param payload - The order data to be created.
 * @returns The created order.
 * @throws Will throw an error if the user is not found or if any database operation fails.
 */

const createOrders = async (payload: { cartItems: TOrder[] }) => {
  const session = await startSession();
  session.startTransaction();
  const { cartItems } = payload;

  try {
    const createdOrders: any[] = [];
    for (const item of cartItems) {
      // Check if user exists and is active
      const user = await UserModel.findById(item.user).session(session);
      if (!user) {
        throw new Error(`User with ID ${item.user} not found!`);
      }
      if (user.status !== "ACTIVE") {
        throw new Error(`User with ID ${item.user} is not active!`);
      }

      // Check if food exists
      const food = await FoodModel.findById(item.food).session(session);
      if (!food) {
        throw new Error(`Food with ID ${item.food} not found!`);
      }

      // Check if the item is already ordered
      const existingOrder = await OrdersModel.findOne({
        food: item.food,
        user: item.user,
      }).session(session);

      // we are not throwing error because in array maybe some order are not duplicated
      // so we are just creating thos that are unique
      if (!existingOrder) {
        // Check if enough quantity is available
        if (food.quantity >= item.quantity) {
          // Deduct the quantity of food
          food.quantity -= item.quantity;
          await food.save({ session });

          const orderPayload = {
            ...item,
            status: "pending",
          };

          // Create the order
          const result = await OrdersModel.create([orderPayload], { session });
          createdOrders.push(result);
        }
      }
    }

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    return createdOrders;
  } catch (error: any) {
    // Rollback the transaction in case of an error
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    throw new Error(`Failed to create orders: ${error.message}`);
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

const updateOrder = async (id: string, payload: Partial<TOrder>) => {
  const order = await OrdersModel.findById(id);
  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, "Oppps! Order is not found!");
  }
  const result = OrdersModel.findByIdAndUpdate(id, { ...payload });
  return result;
};

const deleteOrder = async (orderId: string) => {
  const session = await startSession();
  session.startTransaction();

  try {
    const orderDeletionResult = await OrdersModel.deleteOne(
      { _id: orderId },
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
  createOrder: createOrders,
  getSingleOrder,
  getAllOrders,
  deleteOrder,
  getOrderSummaryOfSingleUser,
  updateOrder,
};
