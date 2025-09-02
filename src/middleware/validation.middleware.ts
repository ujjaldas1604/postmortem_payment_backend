import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import logger from '../config/winston_logger';
import { paymentHelper } from '../Controllers/payment/limsPayment.helper';

// Middleware to check validation results
const checkValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const messages: string[] = [];
        errors.array().forEach((err: any) => {
            if (err.msg !== 'Invalid value') {
                messages.push(err.msg);
            }
        });

        logger.error(`Validation error: ${JSON.stringify(errors.array())}`);
        const response = {
            error: true,
            message: messages.join(', ')
        };
        res.status(400).json(response);
        return;
    } else {
        next();
    }
};

export const checkValidationErrorsWithEncryptedResponse = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const messages: string[] = [];
        errors.array().forEach((err: any) => {
            if (err.msg !== 'Invalid value') {
                messages.push(err.msg);
            }
        });

        logger.error(`Validation error: ${JSON.stringify(errors.array())}`);
        res.status(400).json(
            paymentHelper.encryptPaymentResponse({
                error: true,
                message: messages.join(', '),
            })
        );
        return;
    } else {
        next();
    }
};

export default checkValidationErrors;
