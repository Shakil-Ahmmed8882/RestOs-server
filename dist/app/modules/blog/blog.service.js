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
exports.blogServices = void 0;
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const blog_model_1 = __importDefault(require("./blog.model"));
const sendImageToCloudinary_1 = require("../../utils/sendImageToCloudinary");
const blog_constant_1 = require("./blog.constant");
// Create a new blog
const createBlog = (file, payload) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (file) {
            const imageName = `${payload.author}${payload === null || payload === void 0 ? void 0 : payload.title}`;
            const path = file === null || file === void 0 ? void 0 : file.path;
            //send image to cloudinary
            const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(imageName, path);
            payload.image = secure_url;
        }
        const blogData = yield blog_model_1.default.create(payload);
        return blogData;
    }
    catch (error) {
        console.log(error.message);
    }
});
// Get all blogs with query options
const getAllBlogs = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const blogQuery = new QueryBuilder_1.default(blog_model_1.default.find(), query)
        .search(blog_constant_1.searchableFields)
        .filter()
        .sort()
        .paginate();
    const result = yield blogQuery.modelQuery.populate("author.user");
    return result;
});
// Get a single blog by ID
const getBlogById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const blog = yield blog_model_1.default.findById(id);
    if (!blog)
        throw new Error("Blog not found");
    return blog;
});
// Update a blog by ID
const updateBlogById = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existingBlog = yield blog_model_1.default.findById(id);
    if (!existingBlog)
        throw new Error("Blog not found");
    return yield blog_model_1.default.findByIdAndUpdate(id, payload, { new: true });
});
// Delete a blog by ID
const deleteBlogById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const blog = yield blog_model_1.default.findById(id);
    if (!blog)
        throw new Error("Blog not found");
    return yield blog_model_1.default.findByIdAndDelete(id);
});
exports.blogServices = {
    createBlog,
    getAllBlogs,
    getBlogById,
    updateBlogById,
    deleteBlogById,
};
