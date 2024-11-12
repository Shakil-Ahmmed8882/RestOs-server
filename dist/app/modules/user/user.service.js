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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const user_model_1 = __importDefault(require("./user.model"));
const update_helper_1 = require("../../helper/update.helper");
const validateUserStatus_1 = __importDefault(require("../../helper/validateUserStatus"));
const createUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findOne({ email: payload.email });
    if (user)
        throw new AppError_1.default(http_status_1.default.CONFLICT, "User Already Exist");
    const result = yield user_model_1.default.create(payload);
    return result;
});
const getAllUsers = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const userModelQuery = new QueryBuilder_1.default(user_model_1.default.find(), query).search([
        "name",
        "email",
        "contactNumber",
    ]);
    const result = yield userModelQuery.modelQuery;
    const meta = yield userModelQuery.countTotal();
    return {
        result,
        meta,
    };
});
const getSingleUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Fetch existing user data
    const user = yield (0, validateUserStatus_1.default)(userId);
    return user;
});
const updateUser = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Fetch existing user data
    const existingUserData = yield user_model_1.default.findById(userId);
    if (!existingUserData) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Oops! User is not found!");
    }
    yield (0, validateUserStatus_1.default)(userId);
    const { cuisinePreferences, favoriteRestaurants, dietaryRestrictions, preferredMealTimes, paymentMethods, socialMedia = {} } = payload, rest = __rest(payload, ["cuisinePreferences", "favoriteRestaurants", "dietaryRestrictions", "preferredMealTimes", "paymentMethods", "socialMedia"]);
    // Initialize modified fields for socialMedia and arrays
    let modifiedFieldspdata = {};
    let modifiedArrayData = {};
    // Handle socialMedia updates dynamically
    if (socialMedia && Object.keys(socialMedia).length > 0) {
        for (const [key, value] of Object.entries(socialMedia)) {
            modifiedFieldspdata[`socialMedia.${key}`] = value;
        }
    }
    // Use the helper function for socialMedia updates
    (0, update_helper_1.updateNestedFields)("socialMedia", socialMedia, modifiedFieldspdata);
    // Use the helper function for each array field
    (0, update_helper_1.updateArrayField)("cuisinePreferences", cuisinePreferences, modifiedArrayData);
    (0, update_helper_1.updateArrayField)("favoriteRestaurants", favoriteRestaurants, modifiedArrayData);
    (0, update_helper_1.updateArrayField)("dietaryRestrictions", dietaryRestrictions, modifiedArrayData);
    (0, update_helper_1.updateArrayField)("preferredMealTimes", preferredMealTimes, modifiedArrayData);
    (0, update_helper_1.updateArrayField)("paymentMethods", paymentMethods, modifiedArrayData);
    // Combine direct values, socialMedia updates, and array replacements into one update object
    const result = yield user_model_1.default.updateOne({ _id: userId }, Object.assign(Object.assign(Object.assign({}, rest), modifiedFieldspdata), modifiedArrayData), { runValidators: true, new: true });
    return result;
});
exports.userServices = {
    createUser,
    getAllUsers,
    getSingleUser,
    updateUser,
};
