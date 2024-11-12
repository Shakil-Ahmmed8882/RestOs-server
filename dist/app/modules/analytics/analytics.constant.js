"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionType = exports.PostSearchableFields = void 0;
exports.PostSearchableFields = ['title'];
// Define the ActionType enum
var ActionType;
(function (ActionType) {
    ActionType["VIEW"] = "view";
    ActionType["UPVOTE"] = "upvote";
    ActionType["DOWNVOTE"] = "downvote";
    ActionType["COMMENT"] = "comment";
    ActionType["SAVE_BLOG"] = "save-blog";
    ActionType["UNSAVE_BLOG"] = "unsave-blog";
})(ActionType || (exports.ActionType = ActionType = {}));
