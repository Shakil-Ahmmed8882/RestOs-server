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
exports.AuthServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const config_1 = __importDefault(require("../../config"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = __importDefault(require("../user/user.model"));
const auth_utils_1 = require("./auth.utils");
const shared_1 = require("../../shared");
const constants_1 = require("../../constants");
const sendEmail_1 = require("../../utils/sendEmail");
const loginUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // checking if the user is exist
    const user = yield user_model_1.default.findOne({ email: payload.email });
    if (!user) {
        const userData = Object.assign(Object.assign({}, payload), { photo: payload.photo || shared_1.demoProfileUrl });
        const user = yield createUser(userData);
        const jwtPayload = {
            userId: user === null || user === void 0 ? void 0 : user._id,
            name: user === null || user === void 0 ? void 0 : user.name,
            email: user === null || user === void 0 ? void 0 : user.email,
            role: user === null || user === void 0 ? void 0 : user.role,
            photo: user === null || user === void 0 ? void 0 : user.photo,
        };
        const accessToken = (0, auth_utils_1.createToken)(jwtPayload, config_1.default.jwt_access_secret, config_1.default.jwt_access_expires_in);
        const refreshToken = (0, auth_utils_1.createToken)(jwtPayload, config_1.default.jwt_refresh_secret, config_1.default.jwt_refresh_expires_in);
        return {
            accessToken,
            refreshToken,
        };
    }
    else {
        if (payload.password && user.password) {
            const isPasswordMatched = yield bcryptjs_1.default.compare(payload.password, user === null || user === void 0 ? void 0 : user.password);
            if (!isPasswordMatched) {
                throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Password Incorrect!");
            }
        }
        const jwtPayload = {
            userId: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            photo: user.photo,
        };
        const accessToken = (0, auth_utils_1.createToken)(jwtPayload, config_1.default.jwt_access_secret, config_1.default.jwt_access_expires_in);
        const refreshToken = (0, auth_utils_1.createToken)(jwtPayload, config_1.default.jwt_refresh_secret, config_1.default.jwt_refresh_expires_in);
        return {
            accessToken,
            refreshToken,
        };
    }
    // checking if the user is already deleted
});
const refreshToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    // checking if the given token is valid
    const decoded = (0, auth_utils_1.verifyToken)(token, config_1.default.jwt_refresh_secret);
    const { email } = decoded;
    // checking if the user is exist
    const user = yield user_model_1.default.findOne({ email: email });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "This user is not found !");
    }
    const jwtPayload = {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photo: user.photo,
    };
    const accessToken = (0, auth_utils_1.createToken)(jwtPayload, config_1.default.jwt_access_secret, config_1.default.jwt_access_expires_in);
    return {
        accessToken,
    };
});
const registerUser = (userData) => __awaiter(void 0, void 0, void 0, function* () {
    // post and record it as analytics
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        // when select manual signup there must be passoword
        const existedUser = yield user_model_1.default.findOne({ email: userData.email });
        if (existedUser) {
            throw new Error("User already exist using this same email.");
        }
        if (userData.password) {
            // if manual sign up there is password & hash it
            userData.password = yield bcryptjs_1.default.hash(userData.password, Number(config_1.default.bcrypt_salt_rounds));
        }
        // if social sign up - create user without password
        const DBcreatedUser = yield user_model_1.default.create([
            Object.assign(Object.assign({}, userData), { photo: userData.photo || shared_1.demoProfileUrl, role: constants_1.USER_ROLE.USER }),
        ], { session });
        const createdUser = DBcreatedUser[0];
        if (createdUser === null || createdUser === void 0 ? void 0 : createdUser._id) {
            const jwtPayload = {
                userId: createdUser._id,
                name: createdUser.name,
                email: createdUser.email,
                role: createdUser.role,
                photo: createdUser.photo,
            };
            const accessToken = (0, auth_utils_1.createToken)(jwtPayload, config_1.default.jwt_access_secret, config_1.default.jwt_access_expires_in);
            const refreshToken = (0, auth_utils_1.createToken)(jwtPayload, config_1.default.jwt_refresh_secret, config_1.default.jwt_refresh_expires_in);
            yield session.commitTransaction();
            yield session.endSession();
            return {
                accessToken,
                refreshToken,
            };
        }
    }
    catch (error) {
        yield session.abortTransaction();
        yield session.endSession();
        console.error("Transaction aborted:", error.message);
        throw error;
    }
    finally {
        session.endSession();
    }
});
const createUser = (userData) => __awaiter(void 0, void 0, void 0, function* () {
    if (userData.password) {
        userData.password = yield bcryptjs_1.default.hash(userData.password, Number(config_1.default.bcrypt_salt_rounds));
    }
    const user = yield user_model_1.default.create(Object.assign(Object.assign({}, userData), { role: constants_1.USER_ROLE.USER }));
    return user;
});
const forgetPassword = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    // checking if the user is exist
    const user = yield user_model_1.default.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "This user is not found !");
    }
    // checking if the user is blocked
    const userStatus = user === null || user === void 0 ? void 0 : user.status;
    if (userStatus === "BLOCKED") {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "This user is blocked ! !");
    }
    const jwtPayload = {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photo: user.photo,
    };
    const resetToken = (0, auth_utils_1.createToken)(jwtPayload, config_1.default.jwt_access_secret, "10m");
    const resetUILink = `${config_1.default.reset_pass_ui_link}?id=${user._id}&token=${resetToken} `;
    (0, sendEmail_1.sendEmail)(user.email, resetUILink);
});
const resetPassword = (payload, token) => __awaiter(void 0, void 0, void 0, function* () {
    // checking if the user is exist
    const user = yield (user_model_1.default === null || user_model_1.default === void 0 ? void 0 : user_model_1.default.findById(payload === null || payload === void 0 ? void 0 : payload.userId));
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "This user is not found !");
    }
    // checking if the user is already deleted
    // checking if the user is blocked
    const userStatus = user === null || user === void 0 ? void 0 : user.status;
    if (userStatus === "BLOCKED") {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "This user is blocked ! !");
    }
    const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt_access_secret);
    if (payload.userId !== decoded.userId) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "You are forbidden!");
    }
    //hash new password
    const newHashedPassword = yield bcryptjs_1.default.hash(payload.newPassword, Number(config_1.default.bcrypt_salt_rounds));
    yield user_model_1.default.findOneAndUpdate({
        _id: decoded.userId,
        role: decoded.role,
    }, {
        password: newHashedPassword,
        passwordChangedAt: new Date(),
    });
});
exports.AuthServices = {
    loginUser,
    refreshToken,
    registerUser,
    resetPassword,
    forgetPassword,
};
