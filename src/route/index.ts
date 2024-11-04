import { Router } from "express";
import { foodRoutes } from "../app/modules/foods/food.route";
import { userRoutes } from "../app/modules/user/user.routes";
import { orderRoutes } from "../app/modules/order/order.route";
import { testRoutes } from "../app/modules/tests/test.routes";
import { blogRoutes } from "../app/modules/blog/blog.routes";

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
  {
    path: "/blogs",
    route: blogRoutes,
  },
  {
    path: "/tests",
    route: testRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
