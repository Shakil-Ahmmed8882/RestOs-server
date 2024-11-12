"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRoutes = void 0;
const express_1 = require("express");
const validateRequest_1 = __importDefault(require("../../utils/validateRequest"));
const order_controller_1 = require("./order.controller");
const order_validation_1 = require("./order.validation");
const router = (0, express_1.Router)();
router.post("/create-order", (0, validateRequest_1.default)(order_validation_1.orderValidations.createOrderZodSchema), order_controller_1.orderControllers.handleCreateOrder);
router.get("/:orderId", order_controller_1.orderControllers.handleGetSingleOrder);
router.get("/", order_controller_1.orderControllers.handleGetAllOrders);
router.get("/summary/:userId", order_controller_1.orderControllers.handleGetOrderSummaryOfSingleUser);
router.delete("/:orderId", order_controller_1.orderControllers.handleDeleteOrder);
exports.orderRoutes = router;
