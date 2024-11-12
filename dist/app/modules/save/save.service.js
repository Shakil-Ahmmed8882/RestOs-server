"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const save_model_1 = require("./save.model");
const mongoose_1 = __importDefault(require("mongoose"));
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const validateUserStatus_1 = __importDefault(require("../../helper/validateUserStatus"));
const validateBlogExistance_1 = __importDefault(require("../../helper/validateBlogExistance"));
const save_constant_1 = require("./save.constant");
const analytics_service_1 = __importDefault(require("../analytics/analytics.service"));
/**
 * Save a blog for a user with analytics recording and transaction
 * @param userId - User ID
 * @param blogId - Blog ID to save
 * @returns Promise<void>
 */
const saveBlog = (userId, blogId) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        yield (0, validateUserStatus_1.default)(userId);
        const blog = yield (0, validateBlogExistance_1.default)(blogId);
        const alreadySavedBlog = yield save_model_1.Save.findOne({
            user: new mongoose_1.default.Types.ObjectId(userId),
            blog: new mongoose_1.default.Types.ObjectId(blogId),
        });
        if (alreadySavedBlog) {
            throw new AppError_1.default(http_status_1.default.CONFLICT, "Oops! Already saved!");
        }
        // Create and save a new record in the Save collection
        const result = yield save_model_1.Save.create([
            {
                name: blog.title,
                user: new mongoose_1.default.Types.ObjectId(userId),
                blog: new mongoose_1.default.Types.ObjectId(blogId),
            },
        ], { session });
        // Record analytics for saving a blog
        if (result) {
            yield (0, analytics_service_1.default)({
                blog: new mongoose_1.default.Types.ObjectId(blogId),
                user: new mongoose_1.default.Types.ObjectId(userId),
                actionType: "save-blog",
            }, session);
        }
        yield session.commitTransaction();
        session.endSession();
        return result;
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        console.error("Error saving blog:", error);
        throw new Error("Error saving blog");
    }
});
/**
 * Unsave a blog for a user with analytics recording and transaction
 * @param userId - User ID
 * @param blogId - Blog ID to unsave
 * @returns Promise<void>
 */
const unsaveBlog = (userId, blogId) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        yield (0, validateUserStatus_1.default)(userId);
        yield (0, validateBlogExistance_1.default)(blogId);
        const deletionResult = yield save_model_1.Save.deleteOne({
            user: new mongoose_1.default.Types.ObjectId(userId),
            blog: new mongoose_1.default.Types.ObjectId(blogId),
        }, { session });
        // Only record analytics if a document was actually deleted
        if (deletionResult.deletedCount > 0) {
            yield (0, analytics_service_1.default)({
                blog: new mongoose_1.default.Types.ObjectId(blogId),
                user: new mongoose_1.default.Types.ObjectId(userId),
                actionType: "unsave-blog",
            }, session);
        }
        yield session.commitTransaction();
        session.endSession();
        return deletionResult;
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        console.error("Error unsaving blog:", error);
        throw new Error("Error unsaving blog");
    }
});
/**
 * Get all saved blogs for a user
 * @param userId - User ID
 * @returns Promise<Array<{ blog: mongoose.Types.ObjectId }>>
 */
const getUserSavedBlogs = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, validateUserStatus_1.default)(userId);
        const savedBlogQuery = new QueryBuilder_1.default(save_model_1.Save.find({ user: new mongoose_1.default.Types.ObjectId(userId) }), query)
            .search(save_constant_1.saveBlogSearchableFields)
            .filter()
            .sort()
            .paginate();
        const savedBlogs = yield savedBlogQuery.modelQuery
            .populate("user")
            .populate("blog");
        const meta = yield savedBlogQuery.countTotal();
        return {
            meta,
            data: savedBlogs,
        };
    }
    catch (error) {
        console.error("Error fetching user saved blogs:", error);
        throw new Error("Error fetching user saved blogs");
    }
});
/**
 * Check if a blog is saved by a user
 * @param userId - User ID
 * @param blogId - Blog ID
 * @returns Promise<boolean>
 */
const isBlogSavedByUser = (userId, blogId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, validateUserStatus_1.default)(userId);
        yield (0, validateBlogExistance_1.default)(blogId);
        const savedBlog = yield save_model_1.Save.findOne({
            user: new mongoose_1.default.Types.ObjectId(userId),
            blog: new mongoose_1.default.Types.ObjectId(blogId),
        });
        return !!savedBlog;
    }
    catch (error) {
        console.error("Error checking if blog is saved by user:", error);
        throw new Error("Error checking if blog is saved by user");
    }
});
// Export the save services
exports.saveServices = {
    saveBlog,
    unsaveBlog,
    getUserSavedBlogs,
    isBlogSavedByUser,
};
