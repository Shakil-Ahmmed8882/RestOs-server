import { Router } from "express";
import validateRequest from "../../utils/validateRequest";

import { orderControllers } from "./order.controller";
import { orderValidations } from "./order.validation";

const router = Router();

router.post(
  "/create-order",
  validateRequest(orderValidations.createOrderZodSchema),
  orderControllers.handleCreateOrder
);
router.get("/:orderId", orderControllers.handleGetSingleOrder);
router.get("/", orderControllers.handleGetAllOrders);
router.get("/summary/:userId", orderControllers.handleGetOrderSummaryOfSingleUser);
router.delete("/:orderId", orderControllers.handleDeleteOrder);

export const orderRoutes = router;
