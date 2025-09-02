"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.payloadDecryptionMiddleware = void 0;
const crypto_1 = __importDefault(require("crypto"));
const winston_logger_1 = __importDefault(require("../config/winston_logger"));
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const config_1 = require("../config/config");
const payloadDecryptionMiddleware = (req, res, next) => {
    try {
        winston_logger_1.default.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body
        });
        let mode = "stage";
        if (config_1.config.NODE_ENV == "prod") {
            mode = "prod";
        }
        const keyPath = path_1.default.join(__dirname, '..', 'keys', mode, 'lims_request_private_key.pem');
        const publicKeyPem = (0, fs_1.readFileSync)(keyPath, 'utf8');
        const decrypted = crypto_1.default.privateDecrypt(publicKeyPem, Buffer.from(req.body.payload, 'base64'));
        winston_logger_1.default.info(`decrypted payload:`, JSON.parse(decrypted.toString('utf8')));
        req.body = JSON.parse(decrypted.toString('utf8'));
        next();
    }
    catch (err) {
        winston_logger_1.default.error(`Error in payloadDecryptionMiddleware: ${err}`);
        res.status(500).json({
            message: `Internal Server Error: ${err.message}`
        });
    }
};
exports.payloadDecryptionMiddleware = payloadDecryptionMiddleware;
//# sourceMappingURL=payloadDecryption.middleware.js.map