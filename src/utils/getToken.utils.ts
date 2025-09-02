import { config } from '../config/config.js';
import axios from 'axios';
import { sbiDecryption } from './decrypt.utils.js';
import logger from '../config/winston_logger.js';
import { sbiEncryption } from './encrypt.utils';

const username = config.USERNAME;
const password = config.PASSWORD;
const baseURL = config.SBI_BASE_URL;

// console.log("username,,,,", username, "password...", password, "publickey...", publicKey, "baseURL", baseURL)

const getToken = async (customerID: string, type: 'PaymentsData' | 'Enquiry' = 'PaymentsData') => {
    logger.info(`getToken utils function hit: ${{ customerID }}`);
    try {
        if (!customerID) {
            return {
                error: true,
                message: 'Invalid customerID',
            }
        };
        if (!username || !password)
            return {
                error: true,
                message: 'Invalid username or password',
            }

        const sessionKey = sbiEncryption.generateSessionKey(8);
        const authPayload = {
            username: username,
            password: password,
            application: type,
            client: customerID,
        };

        const encryptedAuthPayload = sbiEncryption.EncryptAES(
            authPayload,
            sessionKey
        );
        const encryptedSessionKey = sbiEncryption.EncryptRSA(sessionKey);

        logger.info(
            `Sending getToken request to ${baseURL}/SBITokenServices/token/getToken`
        );
        const response = await axios.post(
            `${baseURL}/SBITokenServices/token/getToken`,
            {
                AuthTokenRequest: encryptedAuthPayload,
                SessionKey: encryptedSessionKey,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log('getToken response', response.data, response.status);
        if (!response.data?.AuthTokenResponse) {
            return {
                error: true,
                message: 'Invalid token response structure, no AuthTokenResponse',
            }
        }

        if (!response.data?.SessionKey) {
            return {
                error: true,
                message:     `sbi getToken response: ${response.data.AuthTokenResponse}` ||
                    'Invalid token response structure, no SessionKey '
            }
        }

        const responseSessionKey = response.data.SessionKey as string;
        const responseDecryptedSessionKey = await sbiDecryption.DecryptRSA(
            responseSessionKey
        );

        const decrypted_token = sbiDecryption.DecryptAES(
            response.data.AuthTokenResponse,
            responseDecryptedSessionKey
        );
        const tokenObj = JSON.parse(decrypted_token);
        if (!tokenObj?.token) {
            return {
                error: true,
                message: 'Invalid token response structure, no Token',
            }
        }

        logger.info(
            `getToken utils function success: ${JSON.stringify({
                token: tokenObj.token,
                status: tokenObj.remark,
            })}`
        );
        return {
            error: false,
            message: 'Token generated successfully',
            data: {
                token: tokenObj.token,
            },
        };
    } catch (error: any) {
        logger.error(
            `Error in getToken function: ${
                error?.response?.body?.AuthTokenResponse || error.message
            }`
        );
        return {
            error: true,
            message: error?.response?.body?.AuthTokenResponse || error.message,
        };
    }
};

export default getToken;
