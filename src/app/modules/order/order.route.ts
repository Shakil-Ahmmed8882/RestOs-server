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

// "Me" endpoints — userId from JWT, must be declared BEFORE /:orderId
// so the literal path beats the parameterized one.
router.get("/me", auth(USER_ROLE.USER), orderControllers.handleGetMyOrders);
router.get(
  "/me/summary",
  auth(USER_ROLE.USER),
  orderControllers.handleGetMySummary
);
router.delete(
  "/me/pending",
  auth(USER_ROLE.USER),
  orderControllers.handleCancelMyPending
);

// User-scoped list (admin or staff use). Same path-ordering rule.
router.get(
  "/user/:userId",
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  orderControllers.handleGetUserOrders
);

router.get(
  "/summary/:userId",
  orderControllers.handleGetOrderSummaryOfSingleUser
);

router.get("/", orderControllers.handleGetAllOrders);
router.get("/:orderId", orderControllers.handleGetSingleOrder);

router.patch(
  "/:orderId",
  validateRequest(orderValidations.updateOrderZodSchema),
  auth(USER_ROLE.ADMIN),
  orderControllers.handleUpdateOrder
);
router.delete("/:orderId", orderControllers.handleDeleteOrder);

export const orderRoutes = router;
