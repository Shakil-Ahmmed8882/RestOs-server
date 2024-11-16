import { Router } from "express";
import validateRequest from "../../utils/validateRequest";

import { foodCategoryControllers } from "./foodCategory.controller";
import auth from "../../middlewares/auth";
import { USER_ROLE } from "../../constants";
import { foodCategoryValidations } from "./foodCategory.validation";
import { upload } from "../../utils/sendImageToCloudinary";
import parseBody from "../../utils/parseBody";

const router = Router();

// Route to create a category (Admin only)
router.post(
  "/create-category",
  upload.single("file"),
  parseBody,
  auth(USER_ROLE.ADMIN),
  validateRequest(foodCategoryValidations.createFoodCategoryValidationSchema),
  foodCategoryControllers.handleCreateCategory
);

// Route to get all categories
router.get("/", foodCategoryControllers.handleGetAllCategories);

// Route to get a single category by ID
router.get("/:categoryId", foodCategoryControllers.handleGetSingleCategory);

// Route to update a category (Admin only)
router.patch(
  "/:categoryId",
  upload.single("file"),
  parseBody,
  auth(USER_ROLE.ADMIN),
  validateRequest(foodCategoryValidations.updateFoodCategoryValidationSchema),
  foodCategoryControllers.handleUpdateCategory
);

// Route to delete a category (Admin only)
router.delete(
  "/:categoryId",
  auth(USER_ROLE.ADMIN),
  foodCategoryControllers.handleDeleteCategory
);

export const foodCategoryRoutes = router;
