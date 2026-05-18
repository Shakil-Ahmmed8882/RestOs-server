import httpStatus from "http-status";
import mongoose from "mongoose";
import AppError from "../../errors/AppError";
import UserModel from "../user/user.model";
import BlogModel from "../blog/blog.model";
import OrdersModel from "../order/order.model";
import { Save } from "../save/save.model";
import { Comment as CommentModel } from "../comments/comment.model";
import { IProfileOverview, TProfileTab } from "./profile.interface";
import { TUser } from "../user/user.interface";
import {
  updateArrayField,
  updateNestedFields,
} from "../../helper/update.helper";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../media-management";

const assertObjectId = (userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid user id");
  }
};

const getProfileOverview = async (userId: string): Promise<IProfileOverview> => {
  assertObjectId(userId);

  const userDoc = await UserModel.findOne({ _id: userId, isDeleted: false })
    .select("-password")
    .lean();
  if (!userDoc) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [
    blogsCount,
    approvedBlogsCount,
    pendingBlogsCount,
    savedCount,
    ordersCount,
    commentsCount,
    upvotesAgg,
    recommendations,
  ] = await Promise.all([
    BlogModel.countDocuments({ "author.user": userObjectId, isDeleted: false }),
    BlogModel.countDocuments({
      "author.user": userObjectId,
      isDeleted: false,
      status: "approved",
    }),
    BlogModel.countDocuments({
      "author.user": userObjectId,
      isDeleted: false,
      status: "pending",
    }),
    Save.countDocuments({ user: userObjectId }),
    OrdersModel.countDocuments({ user: userObjectId }),
    CommentModel.countDocuments({ user: userObjectId }),
    BlogModel.aggregate([
      { $match: { "author.user": userObjectId, isDeleted: false } },
      { $group: { _id: null, total: { $sum: "$upvotes" } } },
    ]),
    UserModel.find({
      _id: { $ne: userObjectId },
      isDeleted: false,
      status: "ACTIVE",
    })
      .select("name photo bio")
      .sort({ createdAt: -1 })
      .limit(4)
      .lean(),
  ]);

  return {
    user: {
      _id: String(userDoc._id),
      name: userDoc.name,
      email: userDoc.email,
      photo: userDoc.photo,
      bio: userDoc.bio,
      role: userDoc.role,
      status: userDoc.status,
      location: userDoc.location,
      contactNumber: userDoc.contactNumber,
      socialMedia: userDoc.socialMedia,
      diningFrequency: userDoc.diningFrequency,
      cuisinePreferences: userDoc.cuisinePreferences,
      favoriteRestaurants: userDoc.favoriteRestaurants,
      dietaryRestrictions: userDoc.dietaryRestrictions,
      preferredMealTimes: userDoc.preferredMealTimes,
      paymentMethods: userDoc.paymentMethods,
      createdAt: (userDoc as any).createdAt,
    },
    stats: {
      blogsCount,
      approvedBlogsCount,
      pendingBlogsCount,
      savedCount,
      ordersCount,
      commentsCount,
      totalUpvotesReceived: upvotesAgg[0]?.total ?? 0,
    },
    highlights: {
      cuisinePreferences: userDoc.cuisinePreferences ?? [],
      dietaryRestrictions: userDoc.dietaryRestrictions ?? [],
      preferredMealTimes: userDoc.preferredMealTimes ?? [],
    },
    recommendations: recommendations.map((r: any) => ({
      _id: String(r._id),
      name: r.name,
      photo: r.photo,
      bio: r.bio,
    })),
  };
};

const getProfileStats = async (userId: string) => {
  const overview = await getProfileOverview(userId);
  return overview.stats;
};

const paginate = (query: Record<string, unknown>) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 12));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const getProfileContent = async (
  userId: string,
  tab: TProfileTab,
  query: Record<string, unknown>
) => {
  assertObjectId(userId);
  const { page, limit, skip } = paginate(query);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  if (tab === "blogs") {
    const filter: Record<string, unknown> = {
      "author.user": userObjectId,
      isDeleted: false,
    };
    if (query.status) filter.status = query.status;

    const [items, total] = await Promise.all([
      BlogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      BlogModel.countDocuments(filter),
    ]);
    return { items, meta: { page, limit, total } };
  }

  if (tab === "saved") {
    const [items, total] = await Promise.all([
      Save.find({ user: userObjectId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "blog",
          select: "title image category status upvotes downvotes commentsCount author createdAt",
        })
        .lean(),
      Save.countDocuments({ user: userObjectId }),
    ]);
    return { items, meta: { page, limit, total } };
  }

  if (tab === "orders") {
    const filter: Record<string, unknown> = { user: userObjectId };
    if (query.status) filter.status = query.status;

    const [items, total] = await Promise.all([
      OrdersModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "food", select: "name image price category" })
        .lean(),
      OrdersModel.countDocuments(filter),
    ]);
    return { items, meta: { page, limit, total } };
  }

  if (tab === "comments") {
    const [items, total] = await Promise.all([
      CommentModel.find({ user: userObjectId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "blog", select: "title image status" })
        .lean(),
      CommentModel.countDocuments({ user: userObjectId }),
    ]);
    return { items, meta: { page, limit, total } };
  }

  throw new AppError(httpStatus.BAD_REQUEST, "Invalid tab");
};

const buildPublicId = (userId: string) => `user-${userId}`;

const updateMyProfile = async (
  userId: string,
  payload: Partial<TUser>,
  file?: Express.Multer.File
) => {
  assertObjectId(userId);

  const session = await mongoose.startSession();
  session.startTransaction();

  let newlyUploadedPublicId: string | undefined;
  let oldPublicIdToDelete: string | undefined;

  try {
    const existing = await UserModel.findById(userId).session(session);
    if (!existing || existing.isDeleted) {
      await session.abortTransaction();
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    const {
      cuisinePreferences,
      favoriteRestaurants,
      dietaryRestrictions,
      preferredMealTimes,
      paymentMethods,
      socialMedia = {},
      role,
      status,
      email,
      password,
      isDeleted,
      ...rest
    } = payload as any;

    const flat: Record<string, any> = {};
    const arrays: Record<string, any[]> = {};

    if (file?.buffer) {
      const uploaded = await uploadToCloudinary({
        fileBuffer: file.buffer,
        folder: "users",
        publicId: buildPublicId(userId),
        overwrite: true,
      });
      flat.photo = uploaded.url;
      flat.photoPublicId = uploaded.public_id;
      newlyUploadedPublicId = uploaded.public_id;

      if (existing.photoPublicId && existing.photoPublicId !== uploaded.public_id) {
        oldPublicIdToDelete = existing.photoPublicId;
      }
    }

    updateNestedFields("socialMedia", socialMedia, flat);
    updateArrayField("cuisinePreferences", cuisinePreferences, arrays);
    updateArrayField("favoriteRestaurants", favoriteRestaurants, arrays);
    updateArrayField("dietaryRestrictions", dietaryRestrictions, arrays);
    updateArrayField("preferredMealTimes", preferredMealTimes, arrays);
    updateArrayField("paymentMethods", paymentMethods, arrays);

    const updated = await UserModel.findByIdAndUpdate(
      userId,
      { ...rest, ...flat, ...arrays },
      { new: true, runValidators: true, session }
    ).select("-password");

    await session.commitTransaction();

    if (oldPublicIdToDelete) {
      await deleteFromCloudinary(oldPublicIdToDelete);
    }

    return updated;
  } catch (err) {
    await session.abortTransaction();
    if (newlyUploadedPublicId) {
      await deleteFromCloudinary(newlyUploadedPublicId);
    }
    throw err;
  } finally {
    await session.endSession();
  }
};

const updatePreferenceArray = async (
  userId: string,
  field:
    | "cuisinePreferences"
    | "favoriteRestaurants"
    | "dietaryRestrictions"
    | "preferredMealTimes"
    | "paymentMethods",
  action: "add" | "remove" | "replace",
  values: string[]
) => {
  assertObjectId(userId);
  const user = await UserModel.findById(userId);
  if (!user || user.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  let op: Record<string, unknown>;
  if (action === "add") op = { $addToSet: { [field]: { $each: values } } };
  else if (action === "remove") op = { $pull: { [field]: { $in: values } } };
  else op = { $set: { [field]: values } };

  const updated = await UserModel.findByIdAndUpdate(userId, op, {
    new: true,
    runValidators: true,
  }).select("-password");

  return updated;
};

export const profileServices = {
  getProfileOverview,
  getProfileStats,
  getProfileContent,
  updateMyProfile,
  updatePreferenceArray,
};
