"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const food_route_1 = require("../app/modules/foods/food.route");
const user_routes_1 = require("../app/modules/user/user.routes");
const order_route_1 = require("../app/modules/order/order.route");
const test_routes_1 = require("../app/modules/tests/test.routes");
const blog_routes_1 = require("../app/modules/blog/blog.routes");
const auth_route_1 = require("../app/modules/auth/auth.route");
const comment_route_1 = require("../app/modules/comments/comment.route");
const reply_route_1 = require("../app/modules/reply/reply.route");
const vote_route_1 = require("../app/modules/vote/vote.route");
const save_route_1 = require("../app/modules/save/save.route");
const analytics_route_1 = require("../app/modules/analytics/analytics.route");
const router = (0, express_1.Router)();
const moduleRoutes = [
    {
        path: "/auths",
        route: auth_route_1.authRoutes,
    },
    {
        path: "/users",
        route: user_routes_1.userRoutes,
    },
    {
        path: "/foods",
        route: food_route_1.foodRoutes,
    },
    {
        path: "/orders",
        route: order_route_1.orderRoutes,
    },
    {
        path: "/blogs",
        route: blog_routes_1.blogRoutes,
    },
    {
        path: "/comments",
        route: comment_route_1.commentRoutes,
    },
    {
        path: "/replies",
        route: reply_route_1.replyRoutes,
    },
    {
        path: "/votes",
        route: vote_route_1.voteRoutes,
    },
    {
        path: "/saves",
        route: save_route_1.saveRoutes,
    },
    {
        path: "/analytics",
        route: analytics_route_1.analyticRoutes,
    },
    {
        path: "/tests",
        route: test_routes_1.testRoutes,
    },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
