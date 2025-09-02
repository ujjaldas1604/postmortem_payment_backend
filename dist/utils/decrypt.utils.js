"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sbiDecryption = void 0;
const winston_logger_1 = __importDefault(require("../config/winston_logger"));
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const path_1 = require("path");
const config_1 = require("../config/config");
async function DecryptRSA(encryptedKey, privateKeyPath) {
    try {
        winston_logger_1.default.info(`sbi DecryptRSA utils function hit: ${JSON.stringify({ encryptedKey, privateKeyPath })}`);
        let mode = 'stage';
        if (config_1.config.NODE_ENV == 'prod') {
            mode = 'prod';
        }
        const keyPath = privateKeyPath || (0, path_1.join)(__dirname, '..', 'keys', mode, 'sbi_private_key.pem');
        const pemContents = (0, fs_1.readFileSync)(keyPath, 'utf8');
        const encryptedBuffer = Buffer.from(encryptedKey, 'base64');
        const privateKey = (0, crypto_1.createPrivateKey)({
            key: pemContents,
            format: 'pem',
            type: pemContents.includes('BEGIN RSA PRIVATE KEY') ? 'pkcs1' : 'pkcs8'
        });
        const decrypted = (0, crypto_1.privateDecrypt)({
            key: privateKey,
            oaepHash: 'sha1',
            padding: crypto_1.constants.RSA_PKCS1_OAEP_PADDING
        }, encryptedBuffer);
        winston_logger_1.default.info(`Success in sbi DecryptRSA utils function: ${decrypted.toString('utf8')}`);
        return decrypted.toString('utf8');
    }
    catch (error) {
        winston_logger_1.default.error(`Error in sbi DecryptRSA utils function: ${error.message}`);
        throw new Error(`RSA decryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}
function DecryptAES(encryptedTokenRequest, sessionKey) {
    try {
        winston_logger_1.default.info(`sbi DecryptAES utils function hit: ${JSON.stringify({ encryptedTokenRequest, sessionKey })}`);
        const IV = Buffer.alloc(12);
        const bytesKey = Buffer.from(sessionKey, 'utf8');
        const hashedKey = (0, crypto_1.createHash)('sha256').update(bytesKey).digest();
        const truncatedKey = hashedKey.subarray(0, 16);
        const encryptedData = Buffer.from(encryptedTokenRequest, 'base64');
        const authTag = encryptedData.subarray(encryptedData.length - 16);
        const cipherText = encryptedData.subarray(0, encryptedData.length - 16);
        const decipher = (0, crypto_1.createDecipheriv)('aes-128-gcm', truncatedKey, IV, {
            authTagLength: 16
        });
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(cipherText, undefined, 'utf8');
        decrypted += decipher.final('utf8');
        winston_logger_1.default.info(`Success in sbi DecryptAES utils function: ${decrypted}`);
        return decrypted;
    }
    catch (err) {
        winston_logger_1.default.error(`Error in DecryptAES utils function: ${err.message}`);
        throw err;
    }
}
exports.sbiDecryption = {
    DecryptAES,
    DecryptRSA
};
//# sourceMappingURL=decrypt.utils.js.map