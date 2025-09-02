"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUtils = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config/config");
const winston_logger_1 = __importDefault(require("../config/winston_logger"));
const generateID = (idType, prefix = 'LIMS', length = 4) => {
    const random = crypto_1.default.randomBytes(length).toString('hex');
    const id = `${prefix}-${random}-${idType}`;
    return id;
};
const generateAccessToken = (payload, accessSecret) => {
    return jsonwebtoken_1.default.sign(payload, accessSecret, {
        expiresIn: config_1.config.JWT_ACCESS_TOKEN_VALIDITY
    });
};
const verifyJwtToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, config_1.config.JWT_ACCESS_TOKEN_SECRET || 'hard-to-crack-secret');
    }
    catch (error) {
        winston_logger_1.default.error('Error occurred ', {
            stack: error instanceof Error ? error.stack : error
        });
        return null;
    }
};
exports.generateUtils = {
    generateID,
    generateAccessToken,
    verifyJwtToken
};
//# sourceMappingURL=generate.utils.js.map