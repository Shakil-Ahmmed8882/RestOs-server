import { Router } from "express";
import { foodRoutes } from "../app/modules/foods/food.route";
import { userRoutes } from "../app/modules/user/user.routes";

const router = Router();

const moduleRoutes = [
  {
    path: "/foods",
    route: foodRoutes,
  },
  {
    path: "/users",
    route: userRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
