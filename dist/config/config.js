"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
const winston_logger_1 = __importDefault(require("./winston_logger"));
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
const env = process.env.NODE_ENV || 'dev';
switch (env) {
    case 'prod':
        winston_logger_1.default.info('loading prod env');
        dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env.prod'), override: true });
        break;
    case 'dev':
        winston_logger_1.default.info('loading dev env');
        break;
    default:
        winston_logger_1.default.info('loading default dev env');
        break;
}
exports.config = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT || 3000,
    SERVER: process.env.SERVER,
    DATABASE: process.env.DATABASE,
    SBI_BASE_URL: process.env.SBI_BASE_URL,
    CUSTOMER_ID: process.env.CUSTOMER_ID,
    USERNAME: process.env.USERNAME,
    PASSWORD: process.env.PASSWORD,
    SBI_PUBLIC_KEY: process.env.SBI_PUBLIC_KEY,
    DEBIT_ACCOUNT_NO: process.env.DEBIT_ACCOUNT_NO,
    JWT_ACCESS_TOKEN_SECRET: process.env.JWT_ACCESS_TOKEN_SECRET,
    JWT_ACCESS_TOKEN_VALIDITY: process.env.JWT_ACCESS_TOKEN_VALIDITY,
    ADMIN_OTP_TIMEOUT: parseInt(process.env.ADMIN_OTP_TIMEOUT || "600000"),
    ADMIN_OTP_COOLDOWN: parseInt(process.env.ADMIN_OTP_COOLDOWN || "30000"),
    PAYMENT_MODE: process.env.PAYMENT_MODE || "UPI",
    AXIOS_LOG: process.env.AXIOS_LOG || "false",
    PAYMENT_WHITELIST_MODE: process.env.PAYMENT_WHITELIST_MODE || "false",
    WHITELISTED_IP_1: process.env.WHITELISTED_IP_1 || "",
    PAYMENT_STATUS_LIMS_ENDPOINT: process.env.PAYMENT_STATUS_LIMS_ENDPOINT || "",
    PAYMENT_STATUS_LIMS_TOKEN: process.env.PAYMENT_STATUS_LIMS_TOKEN || "",
};
if (exports.config.AXIOS_LOG === "true") {
    axios_1.default.interceptors.request.use(request => {
        console.log('Starting Request', request);
        return request;
    });
    axios_1.default.interceptors.response.use(response => {
        console.log('Response:', response);
        return response;
    });
}
//# sourceMappingURL=config.js.map