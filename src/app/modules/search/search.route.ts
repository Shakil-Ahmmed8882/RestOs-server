import { Router } from "express";
import { globalSearchControllers } from "./search.controller";

const router = Router();

router.get("/", globalSearchControllers.handleGlobalSearch)

export const searchRoutes = router;
