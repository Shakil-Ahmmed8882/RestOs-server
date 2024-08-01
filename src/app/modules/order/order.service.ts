import QueryBuilder from "../../builder/QueryBuilder";
import { TOrderFood } from "./order.interface";
import OrdersModel from "./order.model";

const createOrder = async (payload: TOrderFood) => {
  const result = await OrdersModel.create(payload);
  return result;
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
