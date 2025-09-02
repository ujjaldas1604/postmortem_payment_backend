import { config } from '../config/config.js';
import axios from 'axios';

import { sbiEncryption } from './encrypt.utils.js';
import logger from '../config/winston_logger.js';
import { sbiDecryption } from './decrypt.utils.js';
import { CONST } from './CONST.js';

const baseURL = config.SBI_BASE_URL;

const makeBulkPayment = async (token: string, paymentRequest: any, payloadRefNo: string) => {
    try {
        logger.info(
            `makeBulkPayment utils function hit: ${JSON.stringify({
                token,
                paymentRequest
            })}`
        );
        if (!token) throw new Error('Authentication token is required');
        if (!paymentRequest?.CustomerId || !paymentRequest?.PayloadRefId) {
            throw new Error('Missing required transaction details');
        }

        logger.info('generating hash value');
        const sessionKey = sbiEncryption.generateSessionKey(16);
        const HashValue = sbiEncryption.generateSign(JSON.stringify(paymentRequest.PaymentDetails));
        const encryptedPaymentData = sbiEncryption.EncryptAES(
            JSON.stringify({
                ...paymentRequest,
                HashValue
            }),
            sessionKey
        );
        const encryptedSessionKey = sbiEncryption.EncryptRSA(sessionKey);

        // const response = await axios.post(
        //     `${baseURL}${CONST.routes.bulkPayment}`,
        //     {
        //         CustomerId: paymentRequest.CustomerId,
        //         PayloadRefId: payloadRefNo,
        //         PaymentRequest: encryptedPaymentData,
        //         SessionKey: encryptedSessionKey
        //     },
        //     {
        //         headers: {
        //             'Content-Type': 'application/JSON',
        //             Authorization: `Bearer ${token}`
        //         }
        //     }
        // );

        const response = await axios.post(
            `${baseURL}${CONST.routes.bulkPayment}`,
            {
                CustomerId: paymentRequest.CustomerId,
                PayloadRefId: payloadRefNo,
                PaymentRequest: encryptedPaymentData,
                SessionKey: encryptedSessionKey
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            }
        );
        if (!response?.data) {
            throw new Error('Empty response from payment service');
        }
        console.log('makePayment response', response.data, response.status);
        // if (!response.data?.AuthTokenResponse) {
        //     throw new Error('Invalid makePayment response structure, no AuthTokenResponse');
        // }

        // if (!response.data?.SessionKey) {
        //     throw new Error('Invalid makePayment response structure, no SessionKey');
        // }

        if (!response.data?.PaymentAck) {
            throw new Error('Invalid makePayment response structure, no PaymentAck');
        }

        // const responseSessionKey = response.data.SessionKey as string;
        // const responseDecryptedSessionKey = await sbiDecryption.DecryptRSA(responseSessionKey);

        // const decryptedResponse = sbiDecryption.DecryptAES(
        //     response.data.AuthTokenResponse,
        //     responseDecryptedSessionKey
        // );

        const decryptedResponse = await sbiDecryption.DecryptRSA(response?.data?.PaymentAck);

        logger.info(`Success in makePayment utils function: ${decryptedResponse}`);
        return JSON.parse(decryptedResponse);
    } catch (err: any) {
        console.log(err?.response);
        console.log(`api response data: ${err?.response?.data}`);
        logger.error(`Error in makeBulkPayment utils function: ${err?.message}`);
        logger.error(`Error in makePayment utils function: ${JSON.stringify({ err })}`);
        throw err;
    }
};
export default makeBulkPayment;
