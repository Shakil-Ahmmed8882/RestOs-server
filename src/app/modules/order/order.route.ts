import { Router } from "express";
import validateRequest from "../../utils/validateRequest";

import { orderControllers } from "./order.controller";
import { orderValidations } from "./order.validation";
import auth from "../../middlewares/auth";
import { USER_ROLE } from "../../constants";

const router = Router();

router.post(
  "/create-order",
  validateRequest(orderValidations.createOrderZodSchema),
  orderControllers.handleCreateOrder
);
router.get("/:orderId", orderControllers.handleGetSingleOrder);
router.get("/", orderControllers.handleGetAllOrders);
router.get(
  "/summary/:userId",
  orderControllers.handleGetOrderSummaryOfSingleUser
);
router.patch(
  "/:orderId",
  validateRequest(orderValidations.updateOrderZodSchema),
  auth(USER_ROLE.ADMIN),
  orderControllers.handleUpdateOrder
);
router.delete("/:orderId", orderControllers.handleDeleteOrder);

export const orderRoutes = router;
