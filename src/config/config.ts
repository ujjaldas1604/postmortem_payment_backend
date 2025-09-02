import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';
import logger from './winston_logger';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const env = process.env.NODE_ENV || 'dev';

switch (env) {
    case 'prod':
        logger.info('loading prod env');
        dotenv.config({ path: path.resolve(process.cwd(), '.env.prod'), override: true });
        break;
    case 'dev':
        logger.info('loading dev env');
        // dotenv.config({ path: path.resolve(process.cwd(), '.env') });
        break;
    default:
        logger.info('loading default dev env');
        // dotenv.config({ path: path.resolve(process.cwd(), '.env') });
        break;
}
export const config = {
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


//TODO need to move it to someplace better



// Request interceptor
if (config.AXIOS_LOG === "true") {
  axios.interceptors.request.use(request => {
    console.log('Starting Request', request);
    return request;
  });

  // Response interceptor
  axios.interceptors.response.use(response => {
    console.log('Response:', response);
    return response;
  });
}