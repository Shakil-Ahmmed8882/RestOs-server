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
// user.model.ts
const mongoose_1 = __importStar(require("mongoose"));
const constants_1 = require("../../constants");
const userSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    photo: { type: String, required: true },
    role: {
        type: String,
        enum: [constants_1.USER_ROLE.ADMIN, constants_1.USER_ROLE.USER],
        default: constants_1.USER_ROLE.USER
    },
    status: {
        type: String,
        enum: [constants_1.USER_STATUS.ACTIVE, constants_1.USER_STATUS.BLOCKED],
        default: constants_1.USER_STATUS.ACTIVE
    },
    bio: {
        type: String,
        default: "Share a bit about your favorite cuisines, dining habits, or dietary preferences." // Default text
    },
    location: { type: String, default: "" },
    cuisinePreferences: [{ type: String, default: [] }],
    favoriteRestaurants: [{ type: String, default: [] }],
    dietaryRestrictions: [{ type: String, default: [] }],
    contactNumber: { type: String, default: "" },
    socialMedia: {
        instagram: { type: String, default: "" },
        facebook: { type: String, default: "" },
        twitter: { type: String, default: "" }
    },
    diningFrequency: {
        type: String,
        enum: ["Occasionally", "Frequently", "Rarely"],
        default: "Rarely"
    },
    preferredMealTimes: [{
            type: String,
            enum: ["Breakfast", "Lunch", "Dinner"],
            default: ["Lunch"]
        }],
    paymentMethods: [{
            type: String,
            enum: ["Cash", "Credit Card", "Digital Wallet"],
            default: ["Cash"]
        }]
});
const UserModel = mongoose_1.default.model("User", userSchema);
exports.default = UserModel;
