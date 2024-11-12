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
exports.saveControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const save_service_1 = require("./save.service");
/**
 * Save a blog post
 */
const saveBlog = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { blogId } = req.params;
    const userId = req.user.userId;
    const result = yield save_service_1.saveServices.saveBlog(userId, blogId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Blog post saved successfully",
        data: result,
    });
}));
/**
 * Unsave a blog post
 */
const unsaveBlog = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { blogId } = req.params;
    const userId = req.user.userId;
    const result = yield save_service_1.saveServices.unsaveBlog(userId, blogId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Blog post unsaved successfully",
        data: result,
    });
}));
/**
 * Get all saved blog posts for a user
 */
const getUserSavedBlogs = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.userId;
    const result = yield save_service_1.saveServices.getUserSavedBlogs(userId, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Retrieved all saved blog posts successfully",
        meta: result.meta,
        data: result.data,
    });
}));
/**
 * Check if a specific blog post is saved by the user
 */
const isBlogSavedByUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { blogId } = req.params;
    const userId = req.user.userId;
    const isSaved = yield save_service_1.saveServices.isBlogSavedByUser(userId, blogId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Checked if blog post is saved by user",
        data: { isSaved },
    });
}));
exports.saveControllers = {
    saveBlog,
    unsaveBlog,
    getUserSavedBlogs,
    isBlogSavedByUser,
};
