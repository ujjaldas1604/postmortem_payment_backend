import { Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { config } from '../config/config';
import { IRequestWithAdminCreds } from '../interface/global.interface';
import logger from '../config/winston_logger';

const adminAuthorizationMiddleware = async (
    req: IRequestWithAdminCreds,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            logger.error('No token not found');
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        verify(
            token,
            config.JWT_ACCESS_TOKEN_SECRET as string,
            (err, decoded: any) => {
                if (err) {
                    logger.error(
                        `Error in adminAuthorizationMiddleware1: ${err}`
                    );
                    res.status(401).json({ message: 'Unauthorized' });
                    return;
                } else if (!decoded) {
                    logger.error('Invalid token');
                    res.status(401).json({ message: 'Unauthorized' });
                    return;
                } else if (decoded.type !== 'ADMIN') {
                    logger.error('Forbidden for this token');
                    res.status(403).json({ message: 'Forbidden' });
                    return;
                }
                req.admin = decoded;
                logger.info('test', { decoded });
                logger.info('Authorization successful');
                next();
                return;
            }
        );
    } catch (err) {
        logger.error(`Error in adminAuthorizationMiddleware2: ${err}`);
        res.status(500).json({ message: 'Internal Server Error' });
        return;
    }
};

export default adminAuthorizationMiddleware;
