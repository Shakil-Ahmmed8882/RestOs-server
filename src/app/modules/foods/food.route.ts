import { Router } from "express";
import validateRequest from "../../utils/validateRequest";
import { foodValidations } from "./food.validation";
import { foodControllers } from "./food.controller";
import { upload } from "../../utils/sendImageToCloudinary";
import parseBody from "../../utils/parseBody";
import auth from "../../middlewares/auth";
import { USER_ROLE } from "../../constants";

const router = Router();

router.post(
  "/create-food",
  upload.single("file"),
  parseBody,
  validateRequest(foodValidations.createFoodValidationSchema),
  foodControllers.handleCreateFood
);

router.get("/", foodControllers.handleGetAllFoods);
router.get("/:foodId", foodControllers.handleGetSingleFood);
router.get("/top-selling-food", foodControllers.handleGetSingleFood);
router.patch(
  "/:foodId",
  upload.single("file"),
  parseBody,
  validateRequest(foodValidations.foodUpdateValidationSchema),
  foodControllers.handleUpdateFood
);

router.delete(
  "/:foodId",
  auth(USER_ROLE.ADMIN),
  foodControllers.handleDeleteFood
);

export const foodRoutes = router;



