"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = require("jsonwebtoken");
const config_1 = require("../config/config");
const winston_logger_1 = __importDefault(require("../config/winston_logger"));
const adminAuthorizationMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            winston_logger_1.default.error('No token not found');
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        (0, jsonwebtoken_1.verify)(token, config_1.config.JWT_ACCESS_TOKEN_SECRET, (err, decoded) => {
            if (err) {
                winston_logger_1.default.error(`Error in adminAuthorizationMiddleware1: ${err}`);
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            else if (!decoded) {
                winston_logger_1.default.error('Invalid token');
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            else if (decoded.type !== 'ADMIN') {
                winston_logger_1.default.error('Forbidden for this token');
                res.status(403).json({ message: 'Forbidden' });
                return;
            }
            req.admin = decoded;
            winston_logger_1.default.info('test', { decoded });
            winston_logger_1.default.info('Authorization successful');
            next();
            return;
        });
    }
    catch (err) {
        winston_logger_1.default.error(`Error in adminAuthorizationMiddleware2: ${err}`);
        res.status(500).json({ message: 'Internal Server Error' });
        return;
    }
};
exports.default = adminAuthorizationMiddleware;
//# sourceMappingURL=adminAuthorization.middleware.js.map