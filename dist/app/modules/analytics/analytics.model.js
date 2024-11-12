"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Analytics = void 0;
// analytics.model.ts
const mongoose_1 = __importStar(require("mongoose"));
const analytics_constant_1 = require("./analytics.constant");
const analyticsSchema = new mongoose_1.Schema({
    blog: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Blog',
        required: true,
        index: true,
    },
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    actionType: {
        type: String,
        enum: Object.values(analytics_constant_1.ActionType),
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });
// Export the Analytics model
exports.Analytics = mongoose_1.default.models.Analytics || mongoose_1.default.model('Analytics', analyticsSchema);
