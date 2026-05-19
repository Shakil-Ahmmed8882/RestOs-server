import { Router } from "express";
import { saveControllers } from "./save.controller";
import auth from "../../middlewares/auth";
import { USER_ROLE } from "../../constants";

const router = Router();
const userAuth = auth(USER_ROLE.USER, USER_ROLE.ADMIN);

// List my saves (paginated). Optional ?type=blog|food filter for tabs.
router.get("/", userAuth, saveControllers.handleGetMySaves);

// Per-type counts for the Blogs/Foods tab badges.
router.get("/counts", userAuth, saveControllers.handleGetMySavesCounts);

// Save / unsave / check — generic over { type, itemId }.
router.post("/:type/:itemId", userAuth, saveControllers.handleSaveItem);
router.delete("/:type/:itemId", userAuth, saveControllers.handleUnsaveItem);
router.get(
  "/:type/:itemId/is-saved",
  userAuth,
  saveControllers.handleIsItemSaved
);

export const saveRoutes = router;
