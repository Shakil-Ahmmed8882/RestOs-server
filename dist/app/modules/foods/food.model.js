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
const mongoose_1 = __importStar(require("mongoose"));
// Mongoose schema for Review
const reviewSchema = new mongoose_1.Schema({
    customer_name: { type: String, required: true },
    rating: { type: Number, min: 0, max: 5, required: true },
    comment: { type: String, required: true },
    date: { type: String, required: true },
});
// Mongoose schema for FoodData
const foodDataSchema = new mongoose_1.Schema({
    foodName: { type: String, required: true },
    status: { type: String }, // Optional field
    foodImage: { type: String, required: true },
    foodCategory: { type: String, required: true },
    price: { type: Number, required: true },
    orders: { type: Number, required: true },
    quantity: { type: Number, required: true },
    made_by: { type: String, required: true },
    food_origin: { type: String, required: true },
    description: { type: String, required: true },
    reviews: { type: [reviewSchema], required: true },
});
// Mongoose model for FoodData
const FoodModel = mongoose_1.default.model("Food", foodDataSchema);
exports.default = FoodModel;
