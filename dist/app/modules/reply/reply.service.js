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
exports.replyServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
// import { JwtPayload } from 'jsonwebtoken';
// import createAnalyticsRecord from '../../utils/createAnalyticsRecord';
const mongoose_1 = __importDefault(require("mongoose"));
const constants_1 = require("../../constants");
const user_model_1 = __importDefault(require("../user/user.model"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const comment_model_1 = require("../comments/comment.model");
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
// ================= Update Reply ===================
const updateReply = (commentId, replyId, userId, updatedText) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const comment = yield comment_model_1.Comment.findById(commentId).session(session);
        if (!comment) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Comment not found");
        }
        const reply = comment.replies.id(replyId);
        if (!reply) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Reply not found");
        }
        // Check if the reply belongs to the user making the request
        if (reply.user.toString() !== userId.toString()) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, "You are not authorized to update this reply");
        }
        // Update the reply text
        reply.comment = updatedText;
        const updatedComment = yield comment.save({ session });
        yield session.commitTransaction();
        return updatedComment;
    }
    catch (error) {
        yield session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
});
// ================= Delete Reply ===================
const deleteReply = (commentId, replyId, userId, userRole) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const comment = yield comment_model_1.Comment.findById(commentId).session(session);
        if (!comment) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Comment not found");
        }
        const reply = comment.replies.id(replyId);
        if (!reply) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Reply not found");
        }
        // Check if the user is authorized to delete the reply (either the replier or an admin)
        if (reply.user.toString() !== userId.toString() && userRole !== "ADMIN") {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, "You are not authorized to delete this reply");
        }
        // Remove the reply from the replies array using pull()
        comment.replies.pull(replyId);
        const updatedComment = yield comment.save({ session });
        yield session.commitTransaction();
        return updatedComment;
    }
    catch (error) {
        yield session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
});
exports.replyServices = {
    addReplyToComment,
    updateReply,
    deleteReply
};
