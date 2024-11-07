import { Router } from "express";
import { foodRoutes } from "../app/modules/foods/food.route";
import { userRoutes } from "../app/modules/user/user.routes";
import { orderRoutes } from "../app/modules/order/order.route";
import { testRoutes } from "../app/modules/tests/test.routes";
import { blogRoutes } from "../app/modules/blog/blog.routes";
import { authRoutes } from "../app/modules/auth/auth.route";
import { commentRoutes } from "../app/modules/comments/comment.route";
import { replyRoutes } from "../app/modules/reply/reply.route";
import { voteRoutes } from "../app/modules/vote/vote.route";

const router = Router();

const moduleRoutes = [
  {
    path: "/auths",
    route: authRoutes,
  },
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
    path: "/comments",
    route: commentRoutes,
  },
  {
    path: "/replies",
    route: replyRoutes,
  },
  {
    path: "/votes",
    route: voteRoutes,
  },
  {
    path: "/tests",
    route: testRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
