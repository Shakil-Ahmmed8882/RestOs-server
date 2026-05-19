import mongoose from "mongoose";
import OrdersModel from "../order/order.model";
import PaymentModel from "../payment/payment.model";
import BlogModel from "../blog/blog.model";
import { Comment } from "../comments/comment.model";
import { Save } from "../save/save.model";
import { Vote } from "../vote/vote.model";

const { ObjectId } = mongoose.Types;

/**
 * One-call user analytics. Aggregates across orders, payments, blogs,
 * comments, saves, votes — returns lifetime totals plus a 30-day daily
 * time-series for charts. Designed to drive a user dashboard with cards,
 * line charts, and distribution donuts in a single round-trip.
 */
export const userAnalyticsService = {
  async getForUser(userId: string, days = 30) {
    const uid = new ObjectId(userId);
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - (days - 1));

    const [
      orderStats,
      paymentStats,
      blogStats,
      commentStats,
      replyStats,
      saveCount,
      voteStats,
      orderSeries,
      paymentSeries,
      blogSeries,
      commentSeries,
      topFoods,
      topBlogs,
    ] = await Promise.all([
      // Lifetime order rollup grouped by status
      OrdersModel.aggregate([
        { $match: { user: uid } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalPrice: { $sum: "$totalPrice" },
          },
        },
      ]),

      // Lifetime payment rollup grouped by status
      PaymentModel.aggregate([
        { $match: { userId: uid } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            amount: { $sum: "$amount" },
          },
        },
      ]),

      // Lifetime blog rollup grouped by status, with engagement sums
      BlogModel.aggregate([
        { $match: { "author.user": uid, isDeleted: { $ne: true } } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            upvotes: { $sum: "$upvotes" },
            downvotes: { $sum: "$downvotes" },
            commentsReceived: { $sum: "$commentsCount" },
          },
        },
      ]),

      // Comments the user has written (top-level on others' blogs)
      Comment.aggregate([
        { $match: { user: uid } },
        { $count: "count" },
      ]),

      // Replies the user has written (nested in comments)
      Comment.aggregate([
        { $unwind: "$replies" },
        { $match: { "replies.user": uid } },
        { $count: "count" },
      ]),

      // Saves
      Save.countDocuments({ user: uid }),

      // Votes the user has cast, split by type
      Vote.aggregate([
        { $match: { user: uid } },
        { $group: { _id: "$voteType", count: { $sum: 1 } } },
      ]),

      // 30-day daily orders series
      OrdersModel.aggregate([
        { $match: { user: uid, createdAt: { $gte: since } } },
        {
          $group: {
            _id: {
              date: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              status: "$status",
            },
            count: { $sum: 1 },
            totalPrice: { $sum: "$totalPrice" },
          },
        },
        { $sort: { "_id.date": 1 } },
      ]),

      // 30-day daily completed payments series (spend over time)
      PaymentModel.aggregate([
        {
          $match: {
            userId: uid,
            status: "completed",
            createdAt: { $gte: since },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            amount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 30-day daily blogs created
      BlogModel.aggregate([
        {
          $match: {
            "author.user": uid,
            isDeleted: { $ne: true },
            createdAt: { $gte: since },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 30-day daily comments written
      Comment.aggregate([
        { $match: { user: uid, createdAt: { $gte: since } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Top 5 most-ordered foods (by quantity, lifetime)
      OrdersModel.aggregate([
        { $match: { user: uid, status: "confirmed" } },
        {
          $group: {
            _id: "$food",
            foodName: { $first: "$foodName" },
            totalQuantity: { $sum: "$quantity" },
            totalSpent: { $sum: "$totalPrice" },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 5 },
      ]),

      // Top 5 blogs the user has authored, ranked by engagement
      BlogModel.aggregate([
        { $match: { "author.user": uid, isDeleted: { $ne: true } } },
        {
          $project: {
            title: 1,
            upvotes: 1,
            downvotes: 1,
            commentsCount: 1,
            engagementScore: {
              $add: [
                "$upvotes",
                { $multiply: ["$commentsCount", 2] },
                { $multiply: [{ $ifNull: ["$downvotes", 0] }, -0.5] },
              ],
            },
            createdAt: 1,
          },
        },
        { $sort: { engagementScore: -1 } },
        { $limit: 5 },
      ]),
    ]);

    // ---------- shape lifetime totals ----------

    const orderByStatus = { pending: { count: 0, totalPrice: 0 }, confirmed: { count: 0, totalPrice: 0 }, canceled: { count: 0, totalPrice: 0 } } as Record<string, { count: number; totalPrice: number }>;
    for (const r of orderStats) {
      if (r._id && orderByStatus[r._id]) {
        orderByStatus[r._id] = { count: r.count, totalPrice: round2(r.totalPrice) };
      }
    }
    const totalOrders = orderStats.reduce((a, r) => a + r.count, 0);
    const totalOrderValue = orderStats.reduce((a, r) => a + r.totalPrice, 0);

    const paymentByStatus: Record<string, { count: number; amount: number }> = {
      pending: { count: 0, amount: 0 },
      completed: { count: 0, amount: 0 },
      failed: { count: 0, amount: 0 },
      cancelled: { count: 0, amount: 0 },
    };
    for (const r of paymentStats) {
      if (r._id && paymentByStatus[r._id]) {
        paymentByStatus[r._id] = { count: r.count, amount: round2(r.amount) };
      }
    }

    const blogByStatus: Record<string, { count: number; upvotes: number; downvotes: number; commentsReceived: number }> = {
      pending: { count: 0, upvotes: 0, downvotes: 0, commentsReceived: 0 },
      approved: { count: 0, upvotes: 0, downvotes: 0, commentsReceived: 0 },
      "test-approved": { count: 0, upvotes: 0, downvotes: 0, commentsReceived: 0 },
    };
    for (const r of blogStats) {
      if (r._id && blogByStatus[r._id]) {
        blogByStatus[r._id] = {
          count: r.count,
          upvotes: r.upvotes ?? 0,
          downvotes: r.downvotes ?? 0,
          commentsReceived: r.commentsReceived ?? 0,
        };
      }
    }
    const blogsTotal = blogStats.reduce((a, r) => a + r.count, 0);
    const upvotesReceived = blogStats.reduce((a, r) => a + (r.upvotes ?? 0), 0);
    const downvotesReceived = blogStats.reduce((a, r) => a + (r.downvotes ?? 0), 0);
    const commentsReceived = blogStats.reduce((a, r) => a + (r.commentsReceived ?? 0), 0);

    const votesCast = { upvote: 0, downvote: 0 } as Record<string, number>;
    for (const r of voteStats) {
      if (r._id && votesCast[r._id] !== undefined) votesCast[r._id] = r.count;
    }

    // ---------- fill time-series with zero-days so charts have a continuous x-axis ----------

    const dateRange = makeDateRange(since, days);
    const orderSeriesByDay = bucketOrderSeries(orderSeries, dateRange);
    const paidSeries = fillSeries(
      paymentSeries.map((r) => ({ date: r._id, amount: round2(r.amount), count: r.count })),
      dateRange,
      { amount: 0, count: 0 }
    );
    const blogSeriesFilled = fillSeries(
      blogSeries.map((r) => ({ date: r._id, count: r.count })),
      dateRange,
      { count: 0 }
    );
    const commentSeriesFilled = fillSeries(
      commentSeries.map((r) => ({ date: r._id, count: r.count })),
      dateRange,
      { count: 0 }
    );

    return {
      range: {
        days,
        from: dateRange[0],
        to: dateRange[dateRange.length - 1],
      },
      totals: {
        orders: {
          all: totalOrders,
          totalValue: round2(totalOrderValue),
          byStatus: orderByStatus,
        },
        payments: {
          totalSpent: paymentByStatus.completed.amount,
          successfulCount: paymentByStatus.completed.count,
          byStatus: paymentByStatus,
        },
        blogs: {
          all: blogsTotal,
          upvotesReceived,
          downvotesReceived,
          commentsReceived,
          byStatus: blogByStatus,
        },
        activity: {
          commentsWritten: commentStats[0]?.count ?? 0,
          repliesWritten: replyStats[0]?.count ?? 0,
          savedBlogs: saveCount,
          votesCast,
        },
      },
      series: {
        ordersDaily: orderSeriesByDay,
        spendDaily: paidSeries,
        blogsDaily: blogSeriesFilled,
        commentsDaily: commentSeriesFilled,
      },
      top: {
        foods: topFoods.map((f) => ({
          foodId: f._id,
          foodName: f.foodName,
          totalQuantity: f.totalQuantity,
          totalSpent: round2(f.totalSpent),
          orderCount: f.orderCount,
        })),
        blogs: topBlogs.map((b) => ({
          blogId: b._id,
          title: b.title,
          upvotes: b.upvotes ?? 0,
          downvotes: b.downvotes ?? 0,
          commentsCount: b.commentsCount ?? 0,
          engagementScore: round2(b.engagementScore ?? 0),
          createdAt: b.createdAt,
        })),
      },
    };
  },
};

function round2(n: number) {
  return Math.round((n ?? 0) * 100) / 100;
}

function makeDateRange(since: Date, days: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setUTCDate(since.getUTCDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function fillSeries<T extends { date: string }>(
  rows: T[],
  dateRange: string[],
  zero: Omit<T, "date">
): T[] {
  const map = new Map(rows.map((r) => [r.date, r]));
  return dateRange.map(
    (d) => (map.get(d) ?? ({ date: d, ...zero } as unknown as T))
  );
}

function bucketOrderSeries(
  rows: Array<{ _id: { date: string; status: string }; count: number; totalPrice: number }>,
  dateRange: string[]
) {
  const init = () => ({
    pending: 0,
    confirmed: 0,
    canceled: 0,
    totalPrice: 0,
  });
  const byDate = new Map<string, ReturnType<typeof init>>();
  for (const d of dateRange) byDate.set(d, init());

  for (const r of rows) {
    const slot = byDate.get(r._id.date);
    if (!slot) continue;
    const status = r._id.status as "pending" | "confirmed" | "canceled";
    if (slot[status] !== undefined) slot[status] += r.count;
    slot.totalPrice += r.totalPrice;
  }

  return dateRange.map((d) => ({
    date: d,
    ...byDate.get(d)!,
    totalPrice: round2(byDate.get(d)!.totalPrice),
  }));
}
