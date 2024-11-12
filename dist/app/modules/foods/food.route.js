"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.foodRoutes = void 0;
const express_1 = require("express");
const validateRequest_1 = __importDefault(require("../../utils/validateRequest"));
const food_validation_1 = require("./food.validation");
const food_controller_1 = require("./food.controller");
const router = (0, express_1.Router)();
router.post("/create-food", (0, validateRequest_1.default)(food_validation_1.foodValidations.foodValidationSchema), food_controller_1.foodControllers.handleCreateFood);
router.get("/:foodId", food_controller_1.foodControllers.handleGetSingleFood);
router.get("/top-selling-food", food_controller_1.foodControllers.handleGetSingleFood);
router.get("/", food_controller_1.foodControllers.handleGetAllFoods);
exports.foodRoutes = router;
