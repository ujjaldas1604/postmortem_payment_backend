import logger from './../config/winston_logger'
import crypto from 'crypto';
import path from 'path';
import { readFileSync } from 'fs';
import { config } from '../config/config';

export const payloadEncrypt = (payload: string): string => {
    try {
        logger.info(`payloadEncrypt utils function hit: ${JSON.stringify({ payload })}`);
        let mode = "stage";
        if (config.NODE_ENV == "prod") {
            mode = "prod";
        }
        const keyPath = path.join(__dirname, '..', 'keys', mode, 'lims_request_public_key.pem');
        const publicKeyPem = readFileSync(keyPath, 'utf8');
        const encryptedData = crypto.publicEncrypt(publicKeyPem, Buffer.from(payload, 'utf8')).toString('base64');

        return encryptedData;
    } catch (err: any) {
        console.log(err);
        throw err;
    }
};
