"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = require("express");
const validateRequest_1 = __importDefault(require("../../utils/validateRequest"));
const user_validation_1 = require("./user.validation");
const user_controller_1 = require("./user.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const constants_1 = require("../../constants");
const router = (0, express_1.Router)();
router.post("/create-user", (0, validateRequest_1.default)(user_validation_1.userValidations.createUserValidationSchema), user_controller_1.userControllers.handleCreateUser);
router.get("/", (0, auth_1.default)(constants_1.USER_ROLE.USER), user_controller_1.userControllers.handleGetAllUsers);
router.get("/single-user", (0, auth_1.default)(constants_1.USER_ROLE.USER), user_controller_1.userControllers.HandleGetSingleUser);
router.patch("/", (0, auth_1.default)(constants_1.USER_ROLE.USER), (0, validateRequest_1.default)(user_validation_1.userValidations.updateUserValidationSchema), user_controller_1.userControllers.handleUpdateUser);
exports.userRoutes = router;
