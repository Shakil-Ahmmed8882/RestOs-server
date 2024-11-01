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
    const products = await OrdersModel.findOne({
      email: payload.email,
      foodId: payload.foodId,
    });

    // check no duplicate order
    if (products) {
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

    if (user.orders.includes(payload.foodId)) {
      throw new Error("Already exist");
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
  const orderQuery = new QueryBuilder(OrdersModel.find(), query)
    .search(["foodName"])
    .filter()
    .sort()
    .paginate();

  const meta = await orderQuery.countTotal();
  const result = await orderQuery.modelQuery;

  return {
    meta,
    result,
  };
};
const deleteOrder = async (id: string, email: string) => {
  const session = await startSession();
  session.startTransaction();

  try {
    console.log({ id, email });

    await UserModel.updateOne({ email }, { $pull: { orders: id } }).session(
      session
    );

    const orderDeletionResult = await OrdersModel.deleteOne(
      { foodId: id, email },
      {
        session: session,
      }
    );

    if (!orderDeletionResult) {
      throw new Error("Order not found.");
    }

    await session.commitTransaction();
    console.log(orderDeletionResult);
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
 * @param email - The email of the user for whom to retrieve the order summary.
 * @returns An object containing the total purchase price and total order count.
 */
const getOrderSummaryByEmail = async (email: string) => {
  // Fetch orders associated with the user
  const orders = await OrdersModel.find({ email });

  // Calculate totals
  const totalPurchasePrice = orders
    .filter(order => order.status === 'confirmed') 
    .reduce((acc, order) => acc + order.price, 0);

  const totalPurchaseCount = orders.filter(order => order.status === 'confirmed').length; 

  const totalOrderPrice = orders.reduce((acc, order) => acc + order.price, 0).toFixed(2); 

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
  getOrderSummaryByEmail
};
