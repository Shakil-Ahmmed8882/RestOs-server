import { Router } from "express";
import { foodRoutes } from "../app/modules/foods/food.route";
import { userRoutes } from "../app/modules/user/user.routes";
import { orderRoutes } from "../app/modules/order/order.route";

const router = Router();

const moduleRoutes = [
  {
    path: "/users",
    route: userRoutes,
  },
  {
    path: "/foods",
    route: foodRoutes,
  },
  {
    path: "/orders",
    route: orderRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
