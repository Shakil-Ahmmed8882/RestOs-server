import { Analytics } from "./analytics.model";
import QueryBuilder from "../../builder/QueryBuilder";
import mongoose from "mongoose";
import { IAnalytics } from "./analytics.interface";
import { formatTimestamp } from "../../utils/FormatTimestamp";
import UserModel from "../user/user.model";
import FoodModel from "../foods/food.model";
import OrderModel from "../order/order.model";
import PaymentModel from "../payment/payment.model";

// Utility function to create an analytics record
const createAnalyticsRecord = async (
  payload: IAnalytics,
  session?: any
) => {
  try {
    const analyticsData = {
      ...payload,
      date: formatTimestamp(),
      timestamp: new Date(),
    };

    // Session is optional — serverless paths skip transactions because they
    // are flaky on cold-start replica-set connections.
    return session
      ? await Analytics.create([analyticsData], { session })
      : await Analytics.create([analyticsData]);
  } catch (error: any) {
    console.error("Error creating analytics record:", error.message);
    throw error;
  }
};

export default createAnalyticsRecord;

// Retrieve all analytics with query filters (pagination, sorting, etc.)
const getAllAnalytics = async (query: Record<string, unknown>) => {
  const analyticsQuery = new QueryBuilder(Analytics.find(), query)
    .search(["userName","resourceName"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await analyticsQuery.modelQuery.populate("blog").populate("user");
  const metaData = await analyticsQuery.countTotal();

  return {
    meta: metaData,
    data: result,
  };
};

// Aggregate analytics data by action type for admin dashboard
const getAnalyticsSummaryMatrix = async () => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    engagementByType,
    usersByRole,
    foodStats,
    ordersByStatus,
    paymentsByStatus,
    todayActivity,
    thisMonthActivity,
    lastMonthActivity,
    topFoods,
    recentOrders,
    recentUsers,
  ] = await Promise.all([
    Analytics.aggregate([
      { $group: { _id: "$actionType", count: { $sum: 1 } } },
      { $project: { _id: 0, type: "$_id", count: 1 } },
    ]),

    UserModel.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
      { $project: { _id: 0, role: "$_id", count: 1 } },
    ]),

    FoodModel.aggregate([
      {
        $group: {
          _id: null,
          totalFoods: { $sum: 1 },
          totalOrders: { $sum: "$orders" },
          avgRating: { $avg: "$averageRating" },
          availableFoods: { $sum: { $cond: [{ $eq: ["$status", "available"] }, 1, 0] } },
          bestsellers: { $sum: { $cond: ["$bestseller", 1, 0] } },
        },
      },
      { $project: { _id: 0 } },
    ]),

    OrderModel.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 }, revenue: { $sum: "$totalPrice" } } },
      { $project: { _id: 0, status: "$_id", count: 1, revenue: 1 } },
    ]),

    PaymentModel.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$amount" } } },
      { $project: { _id: 0, status: "$_id", count: 1, total: 1 } },
    ]),

    Analytics.countDocuments({ timestamp: { $gte: startOfToday } }),
    Analytics.countDocuments({ timestamp: { $gte: startOfMonth } }),
    Analytics.countDocuments({ timestamp: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),

    // Top 5 foods — include image
    FoodModel.find({ status: "available" })
      .sort({ orders: -1, averageRating: -1 })
      .limit(5)
      .select("foodName foodCategory orders averageRating price foodImage")
      .lean(),

    // Last 5 orders — user photo + food image included
    OrderModel.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name email photo")
      .populate("food", "foodName foodImage")
      .select("status paymentStatus totalPrice quantity createdAt")
      .lean(),

    // 5 newest users — with photo
    UserModel.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email photo role createdAt")
      .lean(),
  ]);

  const totalRevenue = paymentsByStatus.find((p: any) => p.status === "success")?.total ?? 0;
  const totalUsers = usersByRole.reduce((sum: number, u: any) => sum + u.count, 0);

  return {
    // Engagement
    engagementByType,
    todayActivity,
    thisMonthActivity,
    lastMonthActivity,

    // Users
    totalUsers,
    usersByRole,
    recentUsers,

    // Foods
    ...(foodStats[0] ?? { totalFoods: 0, totalOrders: 0, avgRating: 0, availableFoods: 0, bestsellers: 0 }),
    topFoods,

    // Orders & Revenue
    totalRevenue,
    ordersByStatus,
    recentOrders,

    // Payments
    paymentsByStatus,
  };
};

const getUserActionCounts = async (userId: string) => {
  try {
    const results = await Analytics.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: "$actionType",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          type: "$_id",
          count: 1,
        },
      },
    ]);

    return results;
  } catch (error) {
    console.error("Error fetching user action counts:", error);
    throw new Error("Error fetching user action counts");
  }
};

// Export the service functions
export const analyticsServices = {
  getAllAnalytics,
  getAnalyticsSummaryMatrix,
  getUserActionCounts,
};
