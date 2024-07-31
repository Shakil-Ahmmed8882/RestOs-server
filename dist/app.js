"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express = require("express");
exports.app = express();
exports.app.get("/", (req, res) => {
    res.send("Hey");
});
