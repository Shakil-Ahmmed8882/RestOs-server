import { Router } from "express";
import auth from "../../middlewares/auth";
import { USER_ROLE } from "../../constants";
import validateRequest from "../../utils/validateRequest";
import parseBody from "../../utils/parseBody";
import { uploadImage } from "../media-management";
import { profileControllers } from "./profile.controller";
import { profileValidations } from "./profile.validation";

const router = Router();

// --- Authenticated "me" routes ---
router.get(
  "/me",
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  profileControllers.handleGetMyProfile
);

router.get(
  "/me/stats",
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  profileControllers.handleGetProfileStats
);

router.get(
  "/me/content/:tab",
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  profileControllers.handleGetProfileContent
);

router.patch(
  "/me",
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  uploadImage.single("photo"),
  parseBody,
  validateRequest(profileValidations.updateMyProfileValidationSchema),
  profileControllers.handleUpdateMyProfile
);

router.patch(
  "/me/preferences",
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  validateRequest(profileValidations.updatePreferenceValidationSchema),
  profileControllers.handleUpdatePreference
);

// --- Public-ish (auth-gated) viewing of another user's profile ---
router.get(
  "/:userId",
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  profileControllers.handleGetUserProfile
);

router.get(
  "/:userId/stats",
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  profileControllers.handleGetProfileStats
);

router.get(
  "/:userId/content/:tab",
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  profileControllers.handleGetProfileContent
);

export const profileRoutes = router;
