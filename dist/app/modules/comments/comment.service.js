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
exports.CommentService = void 0;
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const comment_model_1 = require("./comment.model");
const http_status_1 = __importDefault(require("http-status"));
// import { JwtPayload } from 'jsonwebtoken';
// import createAnalyticsRecord from '../../utils/createAnalyticsRecord';
const mongoose_1 = __importDefault(require("mongoose"));
const constants_1 = require("../../constants");
const user_model_1 = __importDefault(require("../user/user.model"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const blog_model_1 = __importDefault(require("../blog/blog.model"));
const createComment = (userId, comment) => __awaiter(void 0, void 0, void 0, function* () {
    // post and record it as analytics
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const user = yield user_model_1.default.findById(userId);
        if (!user) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "This User is not found");
        }
        if (user.status === constants_1.USER_STATUS.BLOCKED) {
            throw new AppError_1.default(http_status_1.default.CONFLICT, "Can't comment as this user is already blocked");
        }
        const blog = yield blog_model_1.default.findById(comment.blog);
        if (!blog) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, " This blog is not found");
        }
        if (blog.isDeleted) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, " This blog is deleted");
        }
        yield blog_model_1.default.findByIdAndUpdate(comment.blog, { $inc: { commentsCount: 1 } }, { session });
        const commentResult = yield comment_model_1.Comment.create([Object.assign(Object.assign({}, comment), { user: userId })], {
            session,
        });
        // if (commentResult.length > 0) {
        //   await createAnalyticsRecord(
        //     {
        //       post: commentResult[0]._id.toString(),
        //       user: new Types.ObjectId(userId),
        //       actionType: 'comment',
        //     },
        //     session,
        //   );
        // }
        yield session.commitTransaction();
        yield session.endSession();
        return commentResult;
    }
    catch (error) {
        yield session.abortTransaction();
        yield session.endSession();
        console.error("Transaction aborted:", error.message);
        throw error;
    }
    finally {
        session.endSession();
    }
});
const findCommentById = (commentId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield comment_model_1.Comment.findById(commentId);
});
const getAllComments = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const commentQuery = new QueryBuilder_1.default(comment_model_1.Comment.find(), query)
        .filter()
        .sort()
        .paginate()
        .fields();
    const result = yield commentQuery.modelQuery;
    const metaData = yield commentQuery.countTotal();
    return {
        meta: metaData,
        data: result,
    };
});
const getAllCommentsOnSingleBlog = (blogId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const commentQuery = new QueryBuilder_1.default(comment_model_1.Comment.find({ blog: new mongoose_1.default.Types.ObjectId(blogId) }), query)
        .filter()
        .sort()
        .paginate()
        .fields();
    const result = yield commentQuery.modelQuery
        .populate({
        path: "user",
        select: "name profile email photo",
    });
    const metaData = yield commentQuery.countTotal();
    return {
        meta: metaData,
        data: result,
    };
});
const updateCommentById = (userId, commentId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "This user is not found");
    }
    if (user.status === constants_1.USER_STATUS.BLOCKED) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Opps!! This is user is blocked");
    }
    const comment = yield comment_model_1.Comment.findById(commentId);
    if (!comment) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "This comment is not found");
    }
    if (comment.user.toString() !== userId.toString()) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Opps! You can't edit someone else's comment.");
    }
    const result = yield comment_model_1.Comment.findByIdAndUpdate(commentId, payload, {
        new: true,
        runValidators: true,
    });
    return result;
});
const deleteCommentById = (commentId, user) => __awaiter(void 0, void 0, void 0, function* () {
    // post and record it as analytics
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const comment = yield comment_model_1.Comment.findById(commentId);
        // Check if the user is admin or the author of the post
        const isAuthorized = user.role === "ADMIN" ||
            comment.user.toString() === user.userId.toString();
        if (!isAuthorized) {
            throw new Error("Not authorized to delete this comment");
        }
        yield blog_model_1.default.findByIdAndUpdate(comment.blog, {
            $inc: { commentsCount: -1 },
        }).session(session);
        const result = yield comment_model_1.Comment.findByIdAndDelete(commentId, { session });
        yield session.commitTransaction();
        return result[0];
    }
    catch (error) {
        yield session.abortTransaction();
        console.error("Transaction aborted:", error.message);
        throw error;
    }
    finally {
        session.endSession();
    }
});
// ================= add reply ===================
const addReplyToComment = (commentId, userId, replyText) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        // Check if the user exists
        const user = yield user_model_1.default.findById(userId);
        if (!user) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
        }
        if (user.status === constants_1.USER_STATUS.BLOCKED) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, "User is blocked and cannot reply to comments");
        }
        // Find the comment to reply to
        const comment = yield comment_model_1.Comment.findById(commentId).session(session);
        if (!comment) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Comment not found");
        }
        // Push the reply to the replies array
        const reply = {
            user: userId,
            comment: replyText,
            createdAt: new Date(),
        };
        comment.replies.push(reply);
        // Save the updated comment with the new reply
        const updatedComment = yield comment.save({ session });
        yield session.commitTransaction();
        return updatedComment;
    }
    catch (error) {
        yield session.abortTransaction();
        console.error("Transaction aborted:", error.message);
        throw error;
    }
    finally {
        session.endSession();
    }
});
exports.CommentService = {
    createComment,
    findCommentById,
    getAllComments,
    getAllCommentsOnSingleBlog,
    updateCommentById,
    deleteCommentById,
    addReplyToComment
};
