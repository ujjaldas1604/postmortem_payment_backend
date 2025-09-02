import { Request, Response } from 'express';
import { payloadEncrypt } from '../../utils/payloadEncryption';
import logger from '../../config/winston_logger';
import { config } from '../../config/config';
import { readFileSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

const encryptPayload = async (req: Request, res: Response) => {
    try {
        logger.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body
        });
        const { payload } = req.body;
        if (!payload) {
            res.status(400).json({ message: 'Missing required parameters payload' });
            return;
        }
        const encryptedPayload = payloadEncrypt(JSON.stringify(payload));
        res.status(200).json({
            message: 'Payload encrypted successfully',
            data: encryptedPayload
        });
    } catch (err: any) {
        logger.error(`Error in encryptPayload: ${err}`);
        res.status(500).json({
            message: `Internal Server Error: ${err.message}`
        });
    }
};

const decryptPayload = async (req: Request, res: Response) => {
    try {
        logger.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body
        });

        res.status(200).json(req.body);
    } catch (err: any) {
        logger.error(`Error in decryptPayload: ${err}`);
        res.status(500).json({
            message: `Internal Server Error: ${err.message}`
        });
    }
};

const responsePayloadEncrypt = async (req: Request, res: Response) => {
    try {
        logger.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body
        });

        const {payload} = req.body;
        let mode = "stage";
        if (config.NODE_ENV == "prod") {
            mode = "prod";
        }

        const keyPath = path.join(__dirname, '..', 'keys', mode, 'lims_response_public_key.pem');
        const publicKeyPem = readFileSync(keyPath, 'utf8');

        const decrypted = crypto.privateDecrypt(publicKeyPem, Buffer.from(payload, 'base64'));

        req.body = JSON.parse(decrypted.toString('utf8'));

        res.status(200).json({
            message: 'Payload decrypted successfully',
            data: req.body
        });
    } catch (err: any) {
        logger.error(`Error in responsePayloadDecrypt: ${err}`);
        res.status(500).json({
            message: `Internal Server Error: ${err.message}`
        });
    }
};



export const miscController = {
    encryptPayload,
    decryptPayload,
    responsePayloadEncrypt  
};
