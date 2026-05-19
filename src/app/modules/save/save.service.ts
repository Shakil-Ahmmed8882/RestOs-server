import httpStatus from "http-status";
import mongoose from "mongoose";
import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import validateUserAndStatus from "../../helper/validateUserStatus";
import validateBlogExistence from "../../helper/validateBlogExistance";
import { Save } from "./save.model";
import { TSaveType } from "./save.interface";
import BlogModel from "../blog/blog.model";
import FoodModel from "../foods/food.model";

const oid = (v: string) => new mongoose.Types.ObjectId(v);

/** Resolve a saveable item by type. Returns the cached name we should
 *  store. Throws 404 if the underlying resource is missing. */
async function resolveItem(type: TSaveType, itemId: string): Promise<{ name: string }> {
  if (type === "blog") {
    const blog = await validateBlogExistence(itemId);
    return { name: blog.title };
  }
  if (type === "food") {
    const food = await FoodModel.findById(itemId);
    if (!food) throw new AppError(httpStatus.NOT_FOUND, "Food not found");
    return { name: food.foodName };
  }
  throw new AppError(httpStatus.BAD_REQUEST, `Unsupported save type: ${type}`);
}

/** Save any supported item type. Idempotent guard: 409 if already saved. */
const saveItem = async (userId: string, type: TSaveType, itemId: string) => {
  await validateUserAndStatus(userId);
  const { name } = await resolveItem(type, itemId);

  const already = await Save.findOne({
    user: oid(userId),
    type,
    item: oid(itemId),
  });
  if (already) {
    throw new AppError(httpStatus.CONFLICT, "Already saved");
  }

  const created = await Save.create({
    user: oid(userId),
    type,
    item: oid(itemId),
    name,
    // Mirror to legacy field when type === "blog" so any old reader that
    // still pivots off `save.blog` keeps working during transition.
    ...(type === "blog" ? { blog: oid(itemId) } : {}),
  });

  return created;
};

/** Unsave by type + item. */
const unsaveItem = async (userId: string, type: TSaveType, itemId: string) => {
  await validateUserAndStatus(userId);
  const result = await Save.deleteOne({
    user: oid(userId),
    type,
    item: oid(itemId),
  });

  if (result.deletedCount === 0) {
    // Fallback for very old records that only had `blog` set without `type`
    if (type === "blog") {
      await Save.deleteOne({ user: oid(userId), blog: oid(itemId) });
    }
  }
  return result;
};

/** Is the user saving this item right now? */
const isItemSaved = async (userId: string, type: TSaveType, itemId: string) => {
  const found = await Save.findOne({
    user: oid(userId),
    type,
    item: oid(itemId),
  });
  // Legacy fallback for blog-typed saves missing the discriminator
  if (!found && type === "blog") {
    const legacy = await Save.findOne({ user: oid(userId), blog: oid(itemId) });
    return !!legacy;
  }
  return !!found;
};

/**
 * List a user's saves. If `type` is provided, filter by it (powers the
 * Blogs / Foods tabs on the frontend). Returns the underlying resource
 * info via dynamic populate so the frontend can render thumbnails and
 * titles without a second round-trip — but every field is a reference,
 * never duplicated, so deletes/edits of the source propagate.
 */
const getMySaves = async (
  userId: string,
  query: Record<string, unknown>
) => {
  await validateUserAndStatus(userId);

  const baseFilter: Record<string, unknown> = { user: oid(userId) };
  if (query.type === "blog" || query.type === "food") {
    baseFilter.type = query.type;
  }
  // strip `type` so QueryBuilder.filter() doesn't try to apply it again
  const passthrough = { ...query };
  delete passthrough.type;

  const saveQuery = new QueryBuilder(Save.find(baseFilter), passthrough)
    .search(["name"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await saveQuery.countTotal();
  const docs = await saveQuery.modelQuery;

  // Group ids by type so we can issue one populate query per collection
  const blogIds: mongoose.Types.ObjectId[] = [];
  const foodIds: mongoose.Types.ObjectId[] = [];
  for (const d of docs as any[]) {
    if (d.type === "food") foodIds.push(d.item);
    else blogIds.push(d.item);
  }

  const [blogs, foods] = await Promise.all([
    blogIds.length
      ? BlogModel.find(
          { _id: { $in: blogIds } },
          { title: 1, image: 1, category: 1, status: 1, upvotes: 1, commentsCount: 1 }
        )
      : [],
    foodIds.length
      ? FoodModel.find(
          { _id: { $in: foodIds } },
          { foodName: 1, foodImage: 1, foodCategory: 1, price: 1, discountPercent: 1, status: 1 }
        )
      : [],
  ]);

  const blogMap = new Map(blogs.map((b: any) => [String(b._id), b]));
  const foodMap = new Map(foods.map((f: any) => [String(f._id), f]));

  const data = (docs as any[]).map((d) => {
    const ref =
      d.type === "food"
        ? foodMap.get(String(d.item))
        : blogMap.get(String(d.item));
    // The referenced resource may have been deleted — keep the save row
    // but mark it deleted so the frontend can render a tombstone.
    return {
      _id: d._id,
      type: d.type,
      itemId: d.item,
      name: d.name,
      savedAt: d.timestamp ?? d.createdAt,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      resource: ref ?? null,
      resourceDeleted: !ref,
    };
  });

  return { meta, data };
};

/** Quick per-type counts for the tabs header. */
const getMySavesCounts = async (userId: string) => {
  const rows = await Save.aggregate([
    { $match: { user: oid(userId) } },
    { $group: { _id: "$type", count: { $sum: 1 } } },
  ]);
  const counts = { blog: 0, food: 0, total: 0 };
  for (const r of rows) {
    if (r._id === "blog" || r._id === "food") {
      counts[r._id as "blog" | "food"] = r.count;
    }
  }
  counts.total = counts.blog + counts.food;
  return counts;
};

export const saveServices = {
  saveItem,
  unsaveItem,
  isItemSaved,
  getMySaves,
  getMySavesCounts,
};
