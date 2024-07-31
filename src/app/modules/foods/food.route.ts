import { Router } from "express";
import validateRequest from "../../utils/validateRequest";
import { foodValidations } from "./food.validation";
import { foodControllers } from "./food.controller";

const router = Router();

router.post(
  "/create-food",
  validateRequest(foodValidations.foodValidationSchema),
  foodControllers.createFood
);
router.get("/", foodControllers.getAllFoods);

export const foodRoutes = router;
