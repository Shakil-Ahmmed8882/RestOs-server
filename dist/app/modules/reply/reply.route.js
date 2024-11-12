"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.replyRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const constants_1 = require("../../constants");
const validateRequest_1 = __importDefault(require("../../utils/validateRequest"));
const reply_validation_1 = require("./reply.validation");
const reply_controller_1 = require("./reply.controller");
const router = express_1.default.Router();
// reply to a comment by ID
router.post("/:commentId/reply", (0, auth_1.default)(constants_1.USER_ROLE.USER, constants_1.USER_ROLE.ADMIN), (0, validateRequest_1.default)(reply_validation_1.replyCommentValidationSchema), reply_controller_1.replyControllers.handleAddReplyToComment);
// Update a reply to a comment by reply ID
router.patch("/comments/:commentId/reply/:replyId", (0, auth_1.default)(constants_1.USER_ROLE.USER), (0, validateRequest_1.default)(reply_validation_1.replyCommentValidationSchema), reply_controller_1.replyControllers.handleUpdateReply);
// Delete a reply to a comment by reply ID
router.delete("/comments/:commentId/reply/:replyId", (0, auth_1.default)(constants_1.USER_ROLE.USER, constants_1.USER_ROLE.ADMIN), reply_controller_1.replyControllers.handleDeleteReply);
exports.replyRoutes = router;
