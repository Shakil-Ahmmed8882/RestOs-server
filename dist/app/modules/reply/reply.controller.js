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
exports.replyControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const reply_service_1 = require("./reply.service");
const handleAddReplyToComment = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    // The reply text
    const { comment } = req.body;
    const userId = req.user.userId;
    const result = yield reply_service_1.replyServices.addReplyToComment(commentId, userId, comment);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Reply added to comment successfully",
        data: result,
    });
}));
// Update an existing reply
const handleUpdateReply = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId, replyId } = req.params;
    const { comment } = req.body;
    const userId = req.user.userId;
    const result = yield reply_service_1.replyServices.updateReply(commentId, replyId, userId, comment);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Reply updated successfully",
        data: result,
    });
}));
// Delete a reply
const handleDeleteReply = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId, replyId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    const result = yield reply_service_1.replyServices.deleteReply(commentId, replyId, userId, userRole);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Reply deleted successfully",
        data: result,
    });
}));
exports.replyControllers = {
    handleAddReplyToComment,
    handleUpdateReply,
    handleDeleteReply
};
