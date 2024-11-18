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
router.get("/",auth(USER_ROLE.USER,USER_ROLE.ADMIN), userControllers.handleGetAllUsers);
router.get("/single-user",auth(USER_ROLE.USER,USER_ROLE.ADMIN), userControllers.HandleGetSingleUser);
router.patch("/:userId",auth(USER_ROLE.USER,USER_ROLE.ADMIN), validateRequest(userValidations.updateUserValidationSchema), userControllers.handleUpdateUser);
router.delete("/:userId",auth(USER_ROLE.USER,USER_ROLE.ADMIN), userControllers.handleDeleteUser);

export const userRoutes = router;
