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
exports.VoteService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const vote_model_1 = require("./vote.model");
const mongoose_1 = __importDefault(require("mongoose"));
const blog_model_1 = __importDefault(require("../blog/blog.model"));
const user_model_1 = __importDefault(require("../user/user.model"));
const constants_1 = require("../../constants");
const analytics_service_1 = __importDefault(require("../analytics/analytics.service"));
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const createOrUpdateVote = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { blog: blogId, user: userId, voteType } = payload;
    // Start a session for the transaction
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        // Check if the post exists
        const blog = yield blog_model_1.default.findById(blogId).session(session);
        if (!blog) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Blog not found");
        }
        const user = yield user_model_1.default.findById(userId).session(session);
        if (!user) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
        }
        if (user.status === constants_1.USER_STATUS.BLOCKED) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User is blocked!");
        }
        // Check if the user has already voted on this post
        const existingVote = yield vote_model_1.Vote.findOne({
            blog: blogId,
            user: userId,
        }).session(session);
        if (existingVote) {
            // If the vote type is the same, no need to update
            if (existingVote.voteType === voteType) {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "You have already voted with this type");
            }
            // Update the vote type
            existingVote.voteType = voteType;
            yield existingVote.save({ session });
            // Adjust the blogs vote counts
            if (voteType === "upvote") {
                blog.upvotes += 1;
                blog.downvotes -= 1;
                yield blog.save({ session });
            }
            else {
                blog.downvotes += 1;
                blog.upvotes -= 1;
                yield blog.save({ session });
            }
            // Create analytics record for updating a vote
            yield (0, analytics_service_1.default)({
                blog: blogId,
                user: userId,
                actionType: voteType === "upvote" ? "upvote" : "downvote",
            }, session);
        }
        else {
            // Create a new vote
            yield vote_model_1.Vote.create([{ blog: blogId, user: userId, voteType }], {
                session,
            });
            // Update blog vote counts
            if (voteType === "upvote") {
                blog.upvotes += 1;
            }
            else {
                blog.downvotes += 1;
            }
            // Create analytics record for new vote
            yield (0, analytics_service_1.default)({
                blog: blogId,
                user: userId,
                actionType: voteType === "upvote" ? "upvote" : "downvote",
            }, session);
        }
        // Save post changes
        yield blog.save({ session });
        // Commit the transaction
        yield session.commitTransaction();
        return existingVote || { postId: blogId, userId, voteType };
    }
    catch (error) {
        // If there's an error, abort the transaction
        yield session.abortTransaction();
        throw error;
    }
    finally {
        // End the session
        session.endSession();
    }
});
const getAllVotesOnSingleBlog = (blogId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const voteQuery = new QueryBuilder_1.default(vote_model_1.Vote.find({ blog: blogId }), query)
        .filter()
        .sort()
        .paginate()
        .fields();
    const result = yield voteQuery.modelQuery
        .populate({
        path: "user",
        select: "name photo email",
    })
        .populate({
        path: "blog",
        select: "title description",
    });
    const metaData = yield voteQuery.countTotal();
    return {
        meta: metaData,
        data: result,
    };
});
const getSingleVoteOfSingleUser = (blogId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Start a session for the transaction
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const blog = yield blog_model_1.default.findById(blogId).session(session);
        if (!blog) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Blog not found");
        }
        const vote = yield vote_model_1.Vote.findOne({ blog: blogId, user: userId });
        yield session.commitTransaction();
        return { voteType: vote.voteType };
    }
    catch (error) {
        // If there's an error, abort the transaction
        yield session.abortTransaction();
        throw error;
    }
    finally {
        // End the session
        session.endSession();
    }
});
const deleteVote = (blogId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Start a session for the transaction
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const vote = yield vote_model_1.Vote.findOne({ blog: blogId, user: userId }).session(session);
        if (!vote) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Vote not found");
        }
        if (vote.user.toString() !== userId.toString()) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "You are not authorized to delete this vote");
        }
        // Update the post's vote count before removing
        const blog = yield blog_model_1.default.findById(vote.blog).session(session);
        if (blog) {
            if (vote.voteType === "upvote") {
                blog.upvotes -= 1;
            }
            else {
                blog.downvotes -= 1;
            }
            yield blog.save({ session });
        }
        // Remove the vote
        yield vote_model_1.Vote.deleteOne({ _id: vote._id }).session(session);
        // Commit the transaction
        yield session.commitTransaction();
        return null;
    }
    catch (error) {
        // If there's an error, abort the transaction
        yield session.abortTransaction();
        throw error;
    }
    finally {
        // End the session
        session.endSession();
    }
});
exports.VoteService = {
    createOrUpdateVote,
    deleteVote,
    getAllVotesOnSingleBlog,
    getSingleVoteOfSingleUser,
};
