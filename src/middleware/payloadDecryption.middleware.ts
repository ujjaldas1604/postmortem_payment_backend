import { RequestHandler } from 'express';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import logger from '../config/winston_logger';
import path from 'path';
import { readFileSync } from 'fs';
import { config } from '../config/config';

export const payloadDecryptionMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    try {
        logger.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body
        });

        let mode = "stage";
        if (config.NODE_ENV == "prod") {
            mode = "prod";
        }

        const keyPath = path.join(__dirname, '..', 'keys', mode, 'lims_request_private_key.pem');
        const publicKeyPem = readFileSync(keyPath, 'utf8');

        const decrypted = crypto.privateDecrypt(publicKeyPem, Buffer.from(req.body.payload, 'base64'));
        logger.info(`decrypted payload:`,JSON.parse(decrypted.toString('utf8')) );

        req.body = JSON.parse(decrypted.toString('utf8'));
        next();
    } catch (err: any) {
        logger.error(`Error in payloadDecryptionMiddleware: ${err}`);
        res.status(500).json({
            message: `Internal Server Error: ${err.message}`
        });
    }
};
