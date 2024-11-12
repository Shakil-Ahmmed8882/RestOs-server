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
exports.VoteController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const vote_service_1 = require("./vote.service");
// Cast a vote (upvote/downvote) on a post
const createVote = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { blog, voteType } = req.body;
    const { userId } = req.user;
    const result = yield vote_service_1.VoteService.createOrUpdateVote({
        blog,
        user: userId,
        voteType,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: `Successfully ${voteType}d the blog`,
        data: result,
    });
}));
// Retrieve all votes (upvotes/downvotes) for a specific blog
const getAllVotesOnSingleBlog = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { blogId } = req.params;
    const result = yield vote_service_1.VoteService.getAllVotesOnSingleBlog(blogId, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "All votes are retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
}));
const getSingleVoteOfSingleUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { blogId } = req.params;
    const { userId } = req.user;
    const result = yield vote_service_1.VoteService.getSingleVoteOfSingleUser(blogId, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Signle vote on a blog retrieved successfully",
        data: result,
    });
}));
// Delete a vote (undo the vote)
const deleteVote = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { blogId } = req.params;
    const userId = req.user.userId;
    yield vote_service_1.VoteService.deleteVote(blogId, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Vote deleted successfully",
        data: null,
    });
}));
exports.VoteController = {
    createVote,
    getAllVotesOnSingleBlog,
    deleteVote,
    getSingleVoteOfSingleUser
};
