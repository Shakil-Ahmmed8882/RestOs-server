import { Router } from "express";
import validateRequest from "../../utils/validateRequest";
import { userValidations } from "./user.validation";
import { userControllers } from "./user.controller";
import auth from "../../middlewares/auth";
import { USER_ROLE } from "../../constants";
import { uploadImage } from "../media-management";
import parseBody from "../../utils/parseBody";

const router = Router();

router.post(
  "/create-user",
  auth(USER_ROLE.ADMIN),
  uploadImage.single("photo"),
  parseBody,
  validateRequest(userValidations.createUserValidationSchema),
  userControllers.handleCreateUser
);
router.get("/", auth(USER_ROLE.USER, USER_ROLE.ADMIN), userControllers.handleGetAllUsers);
router.get("/:userId", auth(USER_ROLE.USER, USER_ROLE.ADMIN), userControllers.HandleGetSingleUser);

router.patch(
  "/:userId",
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  uploadImage.single("photo"),
  validateRequest(userValidations.updateUserValidationSchema),
  userControllers.handleUpdateUser
);
router.delete("/:userId", auth(USER_ROLE.USER), userControllers.handleDeleteUser);

router.patch(
  "/:userId/role-status",
  auth(USER_ROLE.ADMIN),
  validateRequest(userValidations.updateUserRoleAndStatusValidationSchema),
  userControllers.handleUpdateUserRoleAndStatus
);

export const userRoutes = router;
