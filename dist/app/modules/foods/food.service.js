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
exports.foodServices = void 0;
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const food_model_1 = __importDefault(require("./food.model"));
const createFood = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield food_model_1.default.create(payload);
    return result;
});
const getSingleFood = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = food_model_1.default.findById(id);
    return result;
});
const getTopSellingFood = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const result = new QueryBuilder_1.default(food_model_1.default.find(), query)
        .search(["foodName"])
        .filter()
        .sort()
        .paginate();
    return yield result.modelQuery;
});
const getAllFoods = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const result = new QueryBuilder_1.default(food_model_1.default.find(), query)
        .search(["foodName"])
        .filter()
        .sort()
        .paginate()
        .fields();
    return yield result.modelQuery;
});
exports.foodServices = {
    createFood,
    getSingleFood,
    getTopSellingFood,
    getAllFoods,
};
