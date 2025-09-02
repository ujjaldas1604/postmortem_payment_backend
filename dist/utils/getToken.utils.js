"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_js_1 = require("../config/config.js");
const axios_1 = __importDefault(require("axios"));
const decrypt_utils_js_1 = require("./decrypt.utils.js");
const winston_logger_js_1 = __importDefault(require("../config/winston_logger.js"));
const encrypt_utils_1 = require("./encrypt.utils");
const username = config_js_1.config.USERNAME;
const password = config_js_1.config.PASSWORD;
const baseURL = config_js_1.config.SBI_BASE_URL;
const getToken = async (customerID, type = 'PaymentsData') => {
    winston_logger_js_1.default.info(`getToken utils function hit: ${{ customerID }}`);
    try {
        if (!customerID) {
            return {
                error: true,
                message: 'Invalid customerID',
            };
        }
        ;
        if (!username || !password)
            return {
                error: true,
                message: 'Invalid username or password',
            };
        const sessionKey = encrypt_utils_1.sbiEncryption.generateSessionKey(8);
        const authPayload = {
            username: username,
            password: password,
            application: type,
            client: customerID,
        };
        const encryptedAuthPayload = encrypt_utils_1.sbiEncryption.EncryptAES(authPayload, sessionKey);
        const encryptedSessionKey = encrypt_utils_1.sbiEncryption.EncryptRSA(sessionKey);
        winston_logger_js_1.default.info(`Sending getToken request to ${baseURL}/SBITokenServices/token/getToken`);
        const response = await axios_1.default.post(`${baseURL}/SBITokenServices/token/getToken`, {
            AuthTokenRequest: encryptedAuthPayload,
            SessionKey: encryptedSessionKey,
        }, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        console.log('getToken response', response.data, response.status);
        if (!response.data?.AuthTokenResponse) {
            return {
                error: true,
                message: 'Invalid token response structure, no AuthTokenResponse',
            };
        }
        if (!response.data?.SessionKey) {
            return {
                error: true,
                message: `sbi getToken response: ${response.data.AuthTokenResponse}` ||
                    'Invalid token response structure, no SessionKey '
            };
        }
        const responseSessionKey = response.data.SessionKey;
        const responseDecryptedSessionKey = await decrypt_utils_js_1.sbiDecryption.DecryptRSA(responseSessionKey);
        const decrypted_token = decrypt_utils_js_1.sbiDecryption.DecryptAES(response.data.AuthTokenResponse, responseDecryptedSessionKey);
        const tokenObj = JSON.parse(decrypted_token);
        if (!tokenObj?.token) {
            return {
                error: true,
                message: 'Invalid token response structure, no Token',
            };
        }
        winston_logger_js_1.default.info(`getToken utils function success: ${JSON.stringify({
            token: tokenObj.token,
            status: tokenObj.remark,
        })}`);
        return {
            error: false,
            message: 'Token generated successfully',
            data: {
                token: tokenObj.token,
            },
        };
    }
    catch (error) {
        winston_logger_js_1.default.error(`Error in getToken function: ${error?.response?.body?.AuthTokenResponse || error.message}`);
        return {
            error: true,
            message: error?.response?.body?.AuthTokenResponse || error.message,
        };
    }
};
exports.default = getToken;
//# sourceMappingURL=getToken.utils.js.map