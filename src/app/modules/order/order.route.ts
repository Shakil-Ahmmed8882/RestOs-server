import { Router } from "express";
import validateRequest from "../../utils/validateRequest";
import { orderFoodValidations } from "./order.validation";
import { orderControllers } from "./order.controller";

const router = Router();

router.post(
  "/create-order",
  validateRequest(orderFoodValidations.createOrderFood),
  orderControllers.handleCreateOrder
);
router.get("/:orderId", orderControllers.handleGetSingleOrder);
router.get("/", orderControllers.handleGetAllOrders);
router.delete("/:orderId/:email", orderControllers.handleDeleteOrder);

export const orderRoutes = router;
