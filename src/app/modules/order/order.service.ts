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
 * Retrieves the order summary for a specific user — totals plus a
 * per-status breakdown (count + price for pending / confirmed / canceled).
 * Drives the tab counters and dashboard cards on the frontend.
 */
const getOrderSummaryOfSingleUser = async (userId: string) => {
  const orders = await OrdersModel.find({ user: userId });

  const empty = { count: 0, totalPrice: 0 };
  const byStatus: Record<"pending" | "confirmed" | "canceled", typeof empty> = {
    pending: { ...empty },
    confirmed: { ...empty },
    canceled: { ...empty },
  };

  for (const o of orders) {
    const key = (o.status as keyof typeof byStatus) ?? "pending";
    if (byStatus[key]) {
      byStatus[key].count += 1;
      byStatus[key].totalPrice += o.totalPrice;
    }
  }

  const totalOrderCount = orders.length;
  const totalOrderPrice = orders.reduce((acc, o) => acc + o.totalPrice, 0);

  return {
    totalOrderCount,
    totalOrderPrice: Number(totalOrderPrice.toFixed(2)),
    // Legacy fields kept for back-compat with existing UI cards
    totalPurchaseCount: byStatus.confirmed.count,
    totalPurchasePrice: Number(byStatus.confirmed.totalPrice.toFixed(2)),
    byStatus: {
      pending: {
        count: byStatus.pending.count,
        totalPrice: Number(byStatus.pending.totalPrice.toFixed(2)),
      },
      confirmed: {
        count: byStatus.confirmed.count,
        totalPrice: Number(byStatus.confirmed.totalPrice.toFixed(2)),
      },
      canceled: {
        count: byStatus.canceled.count,
        totalPrice: Number(byStatus.canceled.totalPrice.toFixed(2)),
      },
    },
  };
};

/**
 * Paginated, filterable, searchable list of a single user's orders.
 * Supports query params: status, paymentStatus, searchTerm (on foodName),
 * sort, page, limit, fields, plus the standard filter passthrough.
 */
const getUserOrders = async (
  userId: string,
  query: Record<string, unknown>
) => {
  const baseFilter = { user: userId };
  const orderQuery = new QueryBuilder(
    OrdersModel.find(baseFilter),
    query
  )
    .search(["foodName"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await orderQuery.countTotal();
  const result = await orderQuery.modelQuery
    .populate("food")
    .populate("user");

  return { meta, result };
};

/**
 * Bulk-cancel every still-pending order belonging to a user. Used by the
 * "Clear pending" action on the frontend orders table. Returns the number
 * of orders updated.
 */
const cancelUserPendingOrders = async (userId: string) => {
  const result = await OrdersModel.updateMany(
    { user: userId, status: "pending" },
    { $set: { status: "canceled", paymentStatus: "cancelled" } }
  );
  return { cancelled: result.modifiedCount };
};

export const OrderServiices = {
  createOrder: createOrders,
  getSingleOrder,
  getAllOrders,
  getUserOrders,
  cancelUserPendingOrders,
  deleteOrder,
  getOrderSummaryOfSingleUser,
  updateOrder,
};
