"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveRoutes = void 0;
const express_1 = require("express");
const save_controller_1 = require("./save.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const constants_1 = require("../../constants");
const router = (0, express_1.Router)();
// Save a blog post for a user
router.post('/:blogId/save', (0, auth_1.default)(constants_1.USER_ROLE.USER), save_controller_1.saveControllers.saveBlog);
// Get all saved blogs for a user
router.get('/', (0, auth_1.default)(constants_1.USER_ROLE.USER), save_controller_1.saveControllers.getUserSavedBlogs);
// Check if a blog is saved by a user
router.get('/:blogId/is-saved', (0, auth_1.default)(constants_1.USER_ROLE.USER), save_controller_1.saveControllers.isBlogSavedByUser);
// Unsave a blog post for a user
router.delete('/:blogId/unsave', (0, auth_1.default)(constants_1.USER_ROLE.USER), save_controller_1.saveControllers.unsaveBlog);
exports.saveRoutes = router;
