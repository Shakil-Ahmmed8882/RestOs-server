import { Router } from "express";
import validateRequest from "../../utils/validateRequest";
import { userValidations } from "./user.validation";
import { userControllers } from "./user.controller";
const router = Router();

router.post(
  "/create-user",
  validateRequest(userValidations.createUserValidationSchema),
  userControllers.handleCreateUser
);
router.get("/", userControllers.handleGetAllUsers);

export const userRoutes = router;
