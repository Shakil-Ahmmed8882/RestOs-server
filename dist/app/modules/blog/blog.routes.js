"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blogRoutes = void 0;
const express_1 = require("express");
const validateRequest_1 = __importDefault(require("../../utils/validateRequest"));
const blog_validation_1 = require("./blog.validation");
const blog_controller_1 = require("./blog.controller");
const sendImageToCloudinary_1 = require("../../utils/sendImageToCloudinary");
const parseBody_1 = __importDefault(require("../../utils/parseBody"));
const router = (0, express_1.Router)();
router.post("/create", sendImageToCloudinary_1.upload.single("file"), parseBody_1.default, (0, validateRequest_1.default)(blog_validation_1.blogValidations.createBlogValidationSchema), blog_controller_1.blogControllers.handleCreateBlog);
router.get("/", blog_controller_1.blogControllers.handleGetAllBlogs);
router.get("/:id", blog_controller_1.blogControllers.handleGetBlogById);
router.patch("/:id", (0, validateRequest_1.default)(blog_validation_1.blogValidations.updateBlogValidationSchema), blog_controller_1.blogControllers.handleUpdateBlogById);
router.delete("/:id", blog_controller_1.blogControllers.handleDeleteBlogById);
exports.blogRoutes = router;
