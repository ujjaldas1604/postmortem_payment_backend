"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.miscController = void 0;
const payloadEncryption_1 = require("../../utils/payloadEncryption");
const winston_logger_1 = __importDefault(require("../../config/winston_logger"));
const config_1 = require("../../config/config");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const encryptPayload = async (req, res) => {
    try {
        winston_logger_1.default.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body
        });
        const { payload } = req.body;
        if (!payload) {
            res.status(400).json({ message: 'Missing required parameters payload' });
            return;
        }
        const encryptedPayload = (0, payloadEncryption_1.payloadEncrypt)(JSON.stringify(payload));
        res.status(200).json({
            message: 'Payload encrypted successfully',
            data: encryptedPayload
        });
    }
    catch (err) {
        winston_logger_1.default.error(`Error in encryptPayload: ${err}`);
        res.status(500).json({
            message: `Internal Server Error: ${err.message}`
        });
    }
};
const decryptPayload = async (req, res) => {
    try {
        winston_logger_1.default.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body
        });
        res.status(200).json(req.body);
    }
    catch (err) {
        winston_logger_1.default.error(`Error in decryptPayload: ${err}`);
        res.status(500).json({
            message: `Internal Server Error: ${err.message}`
        });
    }
};
const responsePayloadEncrypt = async (req, res) => {
    try {
        winston_logger_1.default.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body
        });
        const { payload } = req.body;
        let mode = "stage";
        if (config_1.config.NODE_ENV == "prod") {
            mode = "prod";
        }
        const keyPath = path_1.default.join(__dirname, '..', 'keys', mode, 'lims_response_public_key.pem');
        const publicKeyPem = (0, fs_1.readFileSync)(keyPath, 'utf8');
        const decrypted = crypto_1.default.privateDecrypt(publicKeyPem, Buffer.from(payload, 'base64'));
        req.body = JSON.parse(decrypted.toString('utf8'));
        res.status(200).json({
            message: 'Payload decrypted successfully',
            data: req.body
        });
    }
    catch (err) {
        winston_logger_1.default.error(`Error in responsePayloadDecrypt: ${err}`);
        res.status(500).json({
            message: `Internal Server Error: ${err.message}`
        });
    }
};
exports.miscController = {
    encryptPayload,
    decryptPayload,
    responsePayloadEncrypt
};
//# sourceMappingURL=misc.controller.js.map