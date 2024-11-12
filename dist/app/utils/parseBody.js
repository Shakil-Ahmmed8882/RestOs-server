"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parseBody = (req, res, next) => {
    try {
        req.body = JSON.parse(req.body.data);
        next();
    }
    catch (error) {
        res.status(400).send({ error: "Invalid JSON data." });
    }
    return req.body;
};
exports.default = parseBody;
