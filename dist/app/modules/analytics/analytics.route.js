"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticRoutes = void 0;
const express_1 = require("express");
const analytics_controller_1 = require("./analytics.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const constants_1 = require("../../constants");
const router = (0, express_1.Router)();
router.get('/matrix', 
// auth(USER_ROLE.ADMIN),
analytics_controller_1.analyticControllers.getAnalyticsSummaryMatrix);
router.get('/user/actions-counts', (0, auth_1.default)(constants_1.USER_ROLE.USER), analytics_controller_1.analyticControllers.getUserActionCounts);
router.get('/', 
// auth(USER_ROLE.ADMIN),
analytics_controller_1.analyticControllers.getAllAnalytics);
exports.analyticRoutes = router;
