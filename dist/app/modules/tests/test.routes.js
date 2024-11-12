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
Object.defineProperty(exports, "__esModule", { value: true });
exports.testRoutes = void 0;
const express_1 = require("express");
const sendImageToCloudinary_1 = require("../../utils/sendImageToCloudinary");
const router = (0, express_1.Router)();
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log({ file: req.file });
    let testImag;
    if (req.file) {
        const imageName = `${Math.floor(Math.random() * 10)}-name`;
        const path = (_a = req.file) === null || _a === void 0 ? void 0 : _a.path;
        //send image to cloudinary
        const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(imageName, path);
        testImag = secure_url;
    }
    console.log(testImag);
    res.send("test file upload ");
}));
exports.testRoutes = router;
