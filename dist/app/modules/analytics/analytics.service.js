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
exports.analyticsServices = void 0;
const analytics_model_1 = require("./analytics.model");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
// Utility function to create an analytics record
const createAnalyticsRecord = (payload, session) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const analyticsData = Object.assign(Object.assign({}, payload), { timestamp: new Date() });
        // Save the analytics record to the database
        yield analytics_model_1.Analytics.create([analyticsData], { session });
    }
    catch (error) {
        console.error("Error creating analytics record:", error.message);
        throw error;
    }
});
exports.default = createAnalyticsRecord;
// Retrieve all analytics with query filters (pagination, sorting, etc.)
const getAllAnalytics = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const analyticsQuery = new QueryBuilder_1.default(analytics_model_1.Analytics.find(), query)
        .search(["user.name", "postId"])
        .filter()
        .sort()
        .paginate()
        .fields();
    const result = yield analyticsQuery.modelQuery.populate("user");
    const metaData = yield analyticsQuery.countTotal();
    return {
        meta: metaData,
        data: result,
    };
});
// Aggregate analytics data by action type for admin dashboard
const getAnalyticsSummaryMatrix = () => __awaiter(void 0, void 0, void 0, function* () {
    const results = yield analytics_model_1.Analytics.aggregate([
        {
            $group: {
                _id: "$actionType",
                count: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: 0,
                type: "$_id",
                count: 1,
            },
        },
    ]);
    return results;
});
const mongoose_1 = __importDefault(require("mongoose"));
const getUserActionCounts = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const results = yield analytics_model_1.Analytics.aggregate([
            {
                $match: {
                    user: new mongoose_1.default.Types.ObjectId(userId),
                },
            },
            {
                $group: {
                    _id: "$actionType",
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    type: "$_id",
                    count: 1,
                },
            },
        ]);
        return results;
    }
    catch (error) {
        console.error("Error fetching user action counts:", error);
        throw new Error("Error fetching user action counts");
    }
});
// Export the service functions
exports.analyticsServices = {
    getAllAnalytics,
    getAnalyticsSummaryMatrix,
    getUserActionCounts,
};
