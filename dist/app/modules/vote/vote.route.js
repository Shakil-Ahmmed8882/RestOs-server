"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.voteRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const vote_controller_1 = require("./vote.controller"); // Assuming you have a VoteController
const vote_validation_1 = require("./vote.validation");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const constants_1 = require("../../constants");
const router = express_1.default.Router();
// Cast a vote (upvote or downvote) on a post
router.post("/", (0, auth_1.default)(constants_1.USER_ROLE.ADMIN, constants_1.USER_ROLE.USER), (0, validateRequest_1.default)(vote_validation_1.createVoteValidationSchema), vote_controller_1.VoteController.createVote);
// Get all votes on signgle blog
router.get("/:blogId", (0, auth_1.default)(constants_1.USER_ROLE.ADMIN, constants_1.USER_ROLE.USER), vote_controller_1.VoteController.getAllVotesOnSingleBlog);
// get only one single 
// vote of a user on single blog
router.get("/single-user/blog/:blogId", (0, auth_1.default)(constants_1.USER_ROLE.ADMIN, constants_1.USER_ROLE.USER), vote_controller_1.VoteController.getSingleVoteOfSingleUser);
// Delete a vote (if user wants to undo their vote)
router.delete("/:blogId", (0, auth_1.default)(constants_1.USER_ROLE.ADMIN, constants_1.USER_ROLE.USER), vote_controller_1.VoteController.deleteVote);
// Export the Vote Routes
exports.voteRoutes = router;
