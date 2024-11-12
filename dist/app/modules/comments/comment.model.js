"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const replySchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    comment: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
const commentSchema = new mongoose_1.default.Schema({
    blog: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Blog',
        required: true,
    },
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    comment: {
        type: String,
        required: true,
    },
    replies: [replySchema],
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
    strictPopulate: false,
});
exports.Comment = mongoose_1.default.models.Comment || mongoose_1.default.model('Comment', commentSchema);
