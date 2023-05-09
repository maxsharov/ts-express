"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
var store_1 = require("../store");
var authMiddleware = function (_req, res, next) {
    if (!store_1.default.accessToken) {
        return res.status(401)
            .json({ 'message': 'Token is not available' });
    }
    next();
};
exports.authMiddleware = authMiddleware;
