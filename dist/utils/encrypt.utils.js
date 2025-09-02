"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sbiEncryption = void 0;
const crypto_1 = require("crypto");
const path_1 = __importDefault(require("path"));
const winston_logger_1 = __importDefault(require("../config/winston_logger"));
const fs_1 = require("fs");
const crypto_2 = require("crypto");
const config_1 = require("../config/config");
const EncryptAES = (data, sessionKey) => {
    winston_logger_1.default.info(`sbi EncryptAES utils function hit: ${JSON.stringify({ data, sessionKey })}`);
    const IV = Buffer.alloc(12);
    const byteKey = Buffer.from(sessionKey, 'utf8');
    const hashedKey = (0, crypto_2.createHash)('sha256').update(byteKey).digest();
    const truncatedKey = hashedKey.subarray(0, 16);
    const cipher = (0, crypto_1.createCipheriv)('aes-128-gcm', truncatedKey, IV, {
        authTagLength: 16
    });
    let encrypted = cipher.update(JSON.stringify(data), 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();
    const result = Buffer.concat([encrypted, authTag]);
    winston_logger_1.default.info(`Success in sbi EncryptAES utils function: ${result.toString('base64')}`);
    return result.toString('base64');
};
function EncryptRSA(plaintext, publicKeyPath) {
    try {
        winston_logger_1.default.info(`sbi EncryptRSA utils function hit: ${JSON.stringify({ plaintext, publicKeyPath })}`);
        let mode = "stage";
        if (config_1.config.NODE_ENV == "prod") {
            mode = "prod";
        }
        const keyPath = publicKeyPath || path_1.default.join(__dirname, '..', 'keys', mode, 'sbi_public_key.pem');
        const publicKeyPem = (0, fs_1.readFileSync)(keyPath, 'utf8');
        const publicKeyObj = (0, crypto_1.createPublicKey)({
            key: publicKeyPem,
            format: 'pem',
            type: publicKeyPem.includes('BEGIN RSA PUBLIC KEY') ? 'pkcs1' : 'spki'
        });
        const encrypted = (0, crypto_1.publicEncrypt)({
            key: publicKeyObj,
            oaepHash: 'sha1',
            padding: crypto_1.constants.RSA_PKCS1_OAEP_PADDING
        }, Buffer.from(plaintext, 'utf8'));
        winston_logger_1.default.info(`Success in sbi EncryptRSA utils function: ${encrypted.toString('base64')}`);
        return encrypted.toString('base64');
    }
    catch (error) {
        winston_logger_1.default.error(`Error in sbi EncryptRSA utils function: ${error.message}`);
        throw new Error(`RSA encryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}
function generateSessionKey(n = 16) {
    winston_logger_1.default.info(`sbi generateSessionKey utils function hit: ${JSON.stringify({ n })}`);
    const randomBytesBuffer = (0, crypto_1.randomBytes)(128);
    const randomString = randomBytesBuffer.toString('utf8');
    let result = '';
    let charsLeft = n;
    for (const ch of randomString) {
        if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9')) {
            result += ch;
            charsLeft--;
            if (charsLeft <= 0) {
                break;
            }
        }
    }
    if (charsLeft > 0) {
        result += generateSessionKey(charsLeft);
    }
    winston_logger_1.default.info(`Success in sbi generateSessionKey utils function: ${result}`);
    return result;
}
function generateSign(data, privateKeyPath) {
    try {
        winston_logger_1.default.info(`sbi generateSign utils function hit: ${JSON.stringify({ data, privateKeyPath })}`);
        let mode = "stage";
        if (config_1.config.NODE_ENV == "prod") {
            mode = "prod";
        }
        const privateKeyPem = privateKeyPath || (0, fs_1.readFileSync)(path_1.default.join(__dirname, '..', 'keys', mode, 'sbi_private_key.pem'), 'utf8');
        const privateKey = (0, crypto_1.createPrivateKey)({
            key: privateKeyPem,
            format: 'pem',
            type: privateKeyPem.includes('BEGIN RSA PRIVATE KEY') ? 'pkcs1' : 'pkcs8'
        });
        const signer = (0, crypto_1.createSign)('RSA-SHA256');
        signer.update(data, 'utf8');
        const signature = signer.sign(privateKey);
        winston_logger_1.default.info(`Success in sbi generateSign utils function: ${signature.toString('base64')}`);
        return signature.toString('base64');
    }
    catch (error) {
        winston_logger_1.default.error(`Error in sbi generateSign utils function: ${error.message}`);
        throw new Error(`Signature generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}
exports.sbiEncryption = {
    EncryptAES,
    EncryptRSA,
    generateSessionKey,
    generateSign
};
//# sourceMappingURL=encrypt.utils.js.map