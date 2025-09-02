"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.payloadEncrypt = void 0;
const winston_logger_1 = __importDefault(require("src/config/winston_logger"));
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const config_1 = require("../config/config");
const payloadEncrypt = (payload) => {
    try {
        winston_logger_1.default.info(`payloadEncrypt utils function hit: ${JSON.stringify({ payload })}`);
        let mode = "stage";
        if (config_1.config.NODE_ENV == "prod") {
            mode = "prod";
        }
        const keyPath = path_1.default.join(__dirname, '..', 'keys', mode, 'lims_request_public_key.pem');
        const publicKeyPem = (0, fs_1.readFileSync)(keyPath, 'utf8');
        const encryptedData = crypto_1.default.publicEncrypt(publicKeyPem, Buffer.from(payload, 'utf8')).toString('base64');
        return encryptedData;
    }
    catch (err) {
        console.log(err);
        throw err;
    }
};
exports.payloadEncrypt = payloadEncrypt;
//# sourceMappingURL=payloadEncryption.js.map