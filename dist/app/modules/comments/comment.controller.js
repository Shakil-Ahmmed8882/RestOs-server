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
exports.CommentController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const comment_service_1 = require("./comment.service");
const createComment = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // const userId = req.body.user
    const userId = req.user.userId;
    const result = yield comment_service_1.CommentService.createComment(userId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Comment is created successfully",
        data: result,
    });
}));
const findCommentById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield comment_service_1.CommentService.findCommentById(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Comment is retrieved successfully",
        data: result,
    });
}));
const getAllComments = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield comment_service_1.CommentService.getAllComments(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Comments are retrieved successfully",
        // meta: result.meta,
        data: result.data,
    });
}));
const getAllCommentsOnSingleBlog = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { blogId } = req.params;
    const result = yield comment_service_1.CommentService.getAllCommentsOnSingleBlog(blogId, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "All Comments on single post are retrieved successfully",
        // meta: result.meta,
        data: result.data,
    });
}));
const updateCommentById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    const { userId } = req.user;
    const result = yield comment_service_1.CommentService.updateCommentById(userId, commentId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Comment is updated successfully",
        data: result,
    });
}));
const deleteCommentById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    const result = yield comment_service_1.CommentService.deleteCommentById(commentId, req.user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Comment is deleted successfully",
        data: result && null,
    });
}));
const addReplyToComment = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    const { comment } = req.body; // The reply text
    const userId = req.user.userId; // Assuming `auth` middleware sets `req.user`
    const result = yield comment_service_1.CommentService.addReplyToComment(commentId, userId, comment);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Reply added to comment successfully",
        data: result,
    });
}));
exports.CommentController = {
    createComment,
    findCommentById,
    getAllComments,
    getAllCommentsOnSingleBlog,
    updateCommentById,
    deleteCommentById,
    addReplyToComment,
};
