"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_logger_1 = __importDefault(require("../config/winston_logger"));
const apiUser_model_1 = require("../Models/apiUser.model");
const paymentAuthorizationValidationMiddleware = async (req, res, next) => {
    try {
        winston_logger_1.default.info(`checking Api keys for payment authorization`);
        const { userId, password, apiKey } = req.body;
        if (!userId || !password || !apiKey) {
            res.status(400).json({
                message: 'Missing required parameters userId, password, apiKey',
            });
            return;
        }
        const user = await apiUser_model_1.ApiUserModel.findOne({ userId });
        if (!user) {
            winston_logger_1.default.error(`user not found with id`, { userId });
            res.status(400).json({
                message: 'Authorization Failed, Invalid userId',
            });
            return;
        }
        if (user.password !== password) {
            winston_logger_1.default.error("invalid password provided for id:", { userId });
            res.status(400).json({
                message: 'Authorization Failed, Invalid password provided',
            });
            return;
        }
        if (user.apiKey !== apiKey) {
            winston_logger_1.default.error("invalid apiKey provided for id:", { userId });
            res.status(400).json({
                message: 'Authorization Failed, Invalid apiKey provided',
            });
            return;
        }
        if (!user.active) {
            winston_logger_1.default.error("user has been deactivated for id:", { userId });
            res.status(400).json({
                message: 'Authorization Failed, This account has been deactivated',
            });
            return;
        }
        winston_logger_1.default.info(`payment authorization successful for id:`, { userId });
        req.apiUser = {
            id: user._id,
            name: user.name,
        };
        next();
    }
    catch (err) {
        winston_logger_1.default.error(`Error in paymentAuthorizationValidationMiddleware: ${err}`);
        res.status(500).json({
            message: `Internal Server Error: ${err.message}`,
        });
        return;
    }
};
exports.default = paymentAuthorizationValidationMiddleware;
//# sourceMappingURL=paymentAuthorizationValidation.middleware.js.map