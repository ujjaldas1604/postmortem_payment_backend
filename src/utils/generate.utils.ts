import crypto from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';

import { config } from '../config/config';
import logger from '../config/winston_logger';

const generateID = (idType: string, prefix: string = 'LIMS', length: number = 4): string => {
    const random: string = crypto.randomBytes(length).toString('hex');
    const id = `${prefix}-${random}-${idType}`;
    return id;
};

const generateAccessToken = (payload: object, accessSecret: jwt.Secret): string => {
    return jwt.sign(payload, accessSecret, {
        expiresIn: config.JWT_ACCESS_TOKEN_VALIDITY as jwt.SignOptions['expiresIn']
    });
};

const verifyJwtToken = (token: string): string | JwtPayload | null => {
    try {
        return jwt.verify(token, config.JWT_ACCESS_TOKEN_SECRET || 'hard-to-crack-secret');
    } catch (error) {
        logger.error('Error occurred ', {
            stack: error instanceof Error ? error.stack : error
        });
        return null;
    }
};

export const generateUtils = {
    generateID,
    generateAccessToken,
    verifyJwtToken
};
