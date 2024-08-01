import { Router } from "express";
import validateRequest from "../../utils/validateRequest";
import { foodValidations } from "./food.validation";
import { foodControllers } from "./food.controller";

const router = Router();

router.post(
  "/create-food",
  validateRequest(foodValidations.foodValidationSchema),
  foodControllers.handleCreateFood
);
router.get("/:foodId", foodControllers.handleGetSingleFood);
router.get("/top-selling-food", foodControllers.handleGetSingleFood);
router.get("/", foodControllers.handleGetAllFoods);

export const foodRoutes = router;
