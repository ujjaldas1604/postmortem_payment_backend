"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_js_1 = require("../config/config.js");
const axios_1 = __importDefault(require("axios"));
const encrypt_utils_js_1 = require("./encrypt.utils.js");
const winston_logger_js_1 = __importDefault(require("../config/winston_logger.js"));
const decrypt_utils_js_1 = require("./decrypt.utils.js");
const CONST_js_1 = require("./CONST.js");
const baseURL = config_js_1.config.SBI_BASE_URL;
const makeBulkPayment = async (token, paymentRequest, payloadRefNo) => {
    try {
        winston_logger_js_1.default.info(`makeBulkPayment utils function hit: ${JSON.stringify({
            token,
            paymentRequest
        })}`);
        if (!token)
            throw new Error('Authentication token is required');
        if (!paymentRequest?.CustomerId || !paymentRequest?.PayloadRefId) {
            throw new Error('Missing required transaction details');
        }
        winston_logger_js_1.default.info('generating hash value');
        const sessionKey = encrypt_utils_js_1.sbiEncryption.generateSessionKey(16);
        const HashValue = encrypt_utils_js_1.sbiEncryption.generateSign(JSON.stringify(paymentRequest.PaymentDetails));
        const encryptedPaymentData = encrypt_utils_js_1.sbiEncryption.EncryptAES(JSON.stringify({
            ...paymentRequest,
            HashValue
        }), sessionKey);
        const encryptedSessionKey = encrypt_utils_js_1.sbiEncryption.EncryptRSA(sessionKey);
        const response = await axios_1.default.post(`${baseURL}${CONST_js_1.CONST.routes.bulkPayment}`, {
            CustomerId: paymentRequest.CustomerId,
            PayloadRefId: payloadRefNo,
            PaymentRequest: encryptedPaymentData,
            SessionKey: encryptedSessionKey
        }, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        });
        if (!response?.data) {
            throw new Error('Empty response from payment service');
        }
        console.log('makePayment response', response.data, response.status);
        if (!response.data?.PaymentAck) {
            throw new Error('Invalid makePayment response structure, no PaymentAck');
        }
        const decryptedResponse = await decrypt_utils_js_1.sbiDecryption.DecryptRSA(response?.data?.PaymentAck);
        winston_logger_js_1.default.info(`Success in makePayment utils function: ${decryptedResponse}`);
        return JSON.parse(decryptedResponse);
    }
    catch (err) {
        console.log(err?.response);
        console.log(`api response data: ${err?.response?.data}`);
        winston_logger_js_1.default.error(`Error in makeBulkPayment utils function: ${err?.message}`);
        winston_logger_js_1.default.error(`Error in makePayment utils function: ${JSON.stringify({ err })}`);
        throw err;
    }
};
exports.default = makeBulkPayment;
//# sourceMappingURL=makeBulkPayment.utils.js.map