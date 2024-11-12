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
const http_status_1 = __importDefault(require("http-status"));
const blog_model_1 = __importDefault(require("../modules/blog/blog.model"));
const AppError_1 = __importDefault(require("../errors/AppError"));
/**
 * Helper function to check if a blog exists
 * @param blogId - Blog ID
 * @returns Promise<void>
 */
const validateBlogExistence = (blogId) => __awaiter(void 0, void 0, void 0, function* () {
    const blog = yield blog_model_1.default.findById(blogId);
    if (!blog) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Oops! Blog not found!!!");
    }
    return blog;
});
exports.default = validateBlogExistence;
