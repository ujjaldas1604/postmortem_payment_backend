import logger from '../config/winston_logger';
import { NextFunction, Response } from 'express';
import { ApiUserModel } from '../Models/apiUser.model';
import { IRequestWithUserCreds } from '../interface/global.interface';

const paymentAuthorizationValidationMiddleware = async (
    req: IRequestWithUserCreds,
    res: Response,
    next: NextFunction
) => {
    try {
        logger.info(`checking Api keys for payment authorization`);
        const { userId, password, apiKey } = req.body;
        if (!userId || !password || !apiKey) {
            res.status(400).json({
                message: 'Missing required parameters userId, password, apiKey',
            });
            return;
        }
        const user = await ApiUserModel.findOne({ userId });
        if (!user) {
            logger.error(`user not found with id`, {userId});
            res.status(400).json({
                message: 'Authorization Failed, Invalid userId',
            });
            return;
        }
        if (user.password !== password) {
            logger.error("invalid password provided for id:", {userId});
            res.status(400).json({
                message: 'Authorization Failed, Invalid password provided',
            });
            return;
        }
        if (user.apiKey !== apiKey) {
            logger.error("invalid apiKey provided for id:", {userId});
            res.status(400).json({
                message: 'Authorization Failed, Invalid apiKey provided',
            });
            return;
        }
        if (!user.active) {
            logger.error("user has been deactivated for id:", {userId});
            res.status(400).json({
                message:
                    'Authorization Failed, This account has been deactivated',
            });
            return;
        }

        logger.info(`payment authorization successful for id:`, {userId});
        req.apiUser = {
            id: user._id as any,
            name: user.name,
        };
        next();
    } catch (err: any) {
        logger.error(
            `Error in paymentAuthorizationValidationMiddleware: ${err}`
        );
        res.status(500).json({
            message: `Internal Server Error: ${err.message}`,
        });
        return;
    }
};

export default paymentAuthorizationValidationMiddleware;
