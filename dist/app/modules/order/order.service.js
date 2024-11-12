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
exports.OrderServiices = void 0;
const mongoose_1 = require("mongoose");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const order_model_1 = __importDefault(require("./order.model"));
const user_model_1 = __importDefault(require("../user/user.model"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const food_model_1 = __importDefault(require("../foods/food.model"));
const constants_1 = require("../../constants");
/**
 * Creates an order and associates it with a user.
 * Uses a transaction to ensure both operations succeed or fail together.
 *
 * @param payload - The order data to be created.
 * @returns The created order.
 * @throws Will throw an error if the user is not found or if any database operation fails.
 */
const createOrder = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Start a new session for the transaction
    const session = yield (0, mongoose_1.startSession)();
    session.startTransaction();
    try {
        // Find the user by email and
        //include the session in the query
        const user = yield user_model_1.default.findById(payload.user).session(session);
        if (!user) {
            throw new mongoose_1.Error("User not found!");
        }
        if (user.status !== constants_1.USER_STATUS.ACTIVE) {
            throw new mongoose_1.Error("User not active!");
        }
        const food = yield food_model_1.default.findById(payload.food).session(session);
        if (!food) {
            throw new mongoose_1.Error("Food not found!");
        }
        const products = yield order_model_1.default.findOne({
            food: payload.food,
            user: payload.user,
        });
        // check no duplicate order
        if (products) {
            throw new mongoose_1.Error("Opps! this product is already ordered");
        }
        // Create the order in the Orders collection
        const result = yield order_model_1.default.create([payload], { session });
        // Commit the transaction
        yield session.commitTransaction();
        session.endSession();
        return result;
    }
    catch (error) {
        // Abort the transaction in case of error
        yield session.abortTransaction();
        session.endSession();
        console.log(error);
        throw error;
    }
});
const getSingleOrder = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = order_model_1.default.findById(id).populate("food").populate("user");
    return result;
});
const getAllOrders = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const orderQuery = new QueryBuilder_1.default(order_model_1.default.find(), query)
        .search(["foodName"])
        .filter()
        .sort()
        .paginate();
    const meta = yield orderQuery.countTotal();
    const result = yield orderQuery.modelQuery.populate("food").populate("user");
    return {
        meta,
        result,
    };
});
const deleteOrder = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield (0, mongoose_1.startSession)();
    session.startTransaction();
    try {
        const orderDeletionResult = yield order_model_1.default.deleteOne({ _id: orderId }, {
            session: session,
        });
        if (!orderDeletionResult) {
            throw new mongoose_1.Error("Order not found.");
        }
        yield session.commitTransaction();
        return orderDeletionResult;
    }
    catch (error) {
        yield session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
});
/**
 * Retrieves the order summary for a specific user.
 *
 * @param userId - The email of the user for whom to retrieve the order summary.
 * @returns An object containing the total purchase price and total order count.
 */
const getOrderSummaryOfSingleUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Fetch orders associated with the user
    const orders = yield order_model_1.default.find({
        user: userId,
    });
    if (!orders) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Opps! order is not found");
    }
    // Calculate totals
    const totalPurchasePrice = orders
        .filter((order) => order.status === "confirmed")
        .reduce((acc, order) => acc + order.totalPrice, 0);
    const totalPurchaseCount = orders.filter((order) => order.status === "confirmed").length;
    const totalOrderPrice = orders
        .reduce((acc, order) => acc + order.totalPrice, 0)
        .toFixed(2);
    const totalOrderCount = orders.length;
    return {
        totalPurchasePrice,
        totalPurchaseCount,
        totalOrderPrice,
        totalOrderCount,
    };
});
exports.OrderServiices = {
    createOrder,
    getSingleOrder,
    getAllOrders,
    deleteOrder,
    getOrderSummaryOfSingleUser,
};
