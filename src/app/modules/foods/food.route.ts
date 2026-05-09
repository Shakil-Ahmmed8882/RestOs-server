import { Router } from "express";
import validateRequest from "../../utils/validateRequest";
import { foodValidations } from "./food.validation";
import { foodControllers } from "./food.controller";
import { upload } from "../../utils/sendImageToCloudinary";
import parseBody from "../../utils/parseBody";
import auth from "../../middlewares/auth";
import { USER_ROLE } from "../../constants";

const router = Router();

// Admin only - Create food with image upload
router.post(
  "/create-food",
  auth(USER_ROLE.ADMIN),
  upload.single("file"),
  parseBody,
  validateRequest(foodValidations.createFoodValidationSchema),
  foodControllers.handleCreateFood
);

// Public - Get all foods (top selling)
router.get("/top-selling-food", foodControllers.handleGetTopFoods);

// Public - Get all foods
router.get("/", foodControllers.handleGetAllFoods);

// Public - Get single food details
router.get("/:foodId", foodControllers.handleGetSingleFood);

// Admin only - Update food with image upload
router.patch(
  "/:foodId",
  auth(USER_ROLE.ADMIN),
  upload.single("file"),
  parseBody,
  validateRequest(foodValidations.foodUpdateValidationSchema),
  foodControllers.handleUpdateFood
);

// Admin only - Delete food
router.delete(
  "/:foodId",
  auth(USER_ROLE.ADMIN),
  foodControllers.handleDeleteFood
);

// Authenticated users - Add review to food
router.post(
  "/:foodId/review",
  auth(USER_ROLE.USER),
  validateRequest(foodValidations.addReviewValidationSchema),
  foodControllers.handleAddReview
);

export const foodRoutes = router;



