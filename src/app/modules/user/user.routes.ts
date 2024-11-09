import { Router } from "express";
import validateRequest from "../../utils/validateRequest";
import { userValidations } from "./user.validation";
import { userControllers } from "./user.controller";
import auth from "../../middlewares/auth";
import { USER_ROLE } from "../../constants";

const router = Router();

router.post(
  "/create-user",
  validateRequest(userValidations.createUserValidationSchema),
  userControllers.handleCreateUser
);
router.get("/",auth(USER_ROLE.USER), userControllers.handleGetAllUsers);
router.get("/single-user",auth(USER_ROLE.USER), userControllers.HandleGetSingleUser);
router.patch("/",auth(USER_ROLE.USER), validateRequest(userValidations.updateUserValidationSchema), userControllers.handleUpdateUser);

export const userRoutes = router;
