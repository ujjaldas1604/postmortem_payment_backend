"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_js_1 = require("../config/config.js");
const axios_1 = __importDefault(require("axios"));
const encrypt_utils_1 = require("./encrypt.utils");
const decrypt_utils_1 = require("./decrypt.utils");
const baseURL = config_js_1.config.SBI_BASE_URL;
const paymentStatus = async (token, customerId, paymentReferenceNo) => {
    try {
        const sessionKey = encrypt_utils_1.sbiEncryption.generateSessionKey(16);
        const enquiryPayload = JSON.stringify({
            CustomerId: customerId,
            PaymentReferenceNo: paymentReferenceNo
        });
        const encryptedEnquiryPayload = encrypt_utils_1.sbiEncryption.EncryptAES(enquiryPayload, sessionKey);
        const response = await axios_1.default.post(`${baseURL}/RealTimeEnquiryServices/Service/Enquiry/`, {
            EnquiryRequest: encryptedEnquiryPayload,
        }, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        });
        const decryptedResponse = JSON.parse(decrypt_utils_1.sbiDecryption.DecryptAES(response.data, sessionKey));
        return decryptedResponse;
    }
    catch (err) {
        return "Could Not get Status due to error in the Payment Status Function";
    }
};
exports.default = paymentStatus;
//# sourceMappingURL=paymentStatus.utils.js.map