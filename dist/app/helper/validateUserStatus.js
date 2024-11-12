"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const user_model_1 = __importDefault(require("../modules/user/user.model"));
const AppError_1 = __importDefault(require("../errors/AppError"));
const constants_1 = require("../constants");
/**
 * Helper function to check if the user exists and is not blocked
 * @param userId - User ID
 * @returns Promise<void>
 */
const validateUserAndStatus = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    if (user.status === constants_1.USER_STATUS.BLOCKED) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "Oops! This user is BLOCKED!");
    }
    return user;
});
exports.default = validateUserAndStatus;
