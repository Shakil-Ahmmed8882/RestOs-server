"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const comment_controller_1 = require("./comment.controller");
const comment_validation_1 = require("./comment.validation"); // Ensure to create these validation schemas
const auth_1 = __importDefault(require("../../middlewares/auth"));
const constants_1 = require("../../constants");
const router = express_1.default.Router();
// Create a new comment
router.post("/", (0, auth_1.default)(constants_1.USER_ROLE.USER, constants_1.USER_ROLE.ADMIN), (0, validateRequest_1.default)(comment_validation_1.createCommentValidationSchema), comment_controller_1.CommentController.createComment);
// Get all comments on a specific blog
router.get("/:blogId", (0, auth_1.default)(constants_1.USER_ROLE.USER, constants_1.USER_ROLE.ADMIN), comment_controller_1.CommentController.getAllCommentsOnSingleBlog);
// Get all comments
router.get("/", (0, auth_1.default)(constants_1.USER_ROLE.ADMIN), comment_controller_1.CommentController.getAllComments);
// Update a comment by ID
router.patch("/:commentId", (0, auth_1.default)(constants_1.USER_ROLE.USER), (0, validateRequest_1.default)(comment_validation_1.updateCommentValidationSchema), comment_controller_1.CommentController.updateCommentById);
// Delete a comment by ID
router.delete("/:commentId", (0, auth_1.default)(constants_1.USER_ROLE.ADMIN, constants_1.USER_ROLE.USER), comment_controller_1.CommentController.deleteCommentById);
exports.commentRoutes = router;
