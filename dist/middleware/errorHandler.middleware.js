"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle404 = exports.errorHandler = void 0;
const winston_logger_1 = __importDefault(require("../config/winston_logger"));
const errorHandler = (err, req, res, _next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    winston_logger_1.default.error(`Error: ${message}`, {
        method: req.method,
        url: req.originalUrl,
        statusCode,
        stack: err.stack || 'No stack trace available'
    });
    res.status(statusCode).json({
        error: true,
        code: 'ERR_GLOBAL_00001',
        message: message,
        data: null
    });
};
exports.errorHandler = errorHandler;
const handle404 = (req, res, _next) => {
    const message = `Can't find ${req.originalUrl} on this server!`;
    winston_logger_1.default.warn(`404 Not Found: ${message}`, {
        method: req.method,
        url: req.originalUrl
    });
    res.status(404).json({
        error: true,
        code: 'ERR_GLOBAL_00001',
        message: `Can't find ${req.originalUrl} on this server!`,
        data: null
    });
};
exports.handle404 = handle404;
//# sourceMappingURL=errorHandler.middleware.js.map