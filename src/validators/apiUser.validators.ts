import { body } from 'express-validator';
import logger from '../config/winston_logger';

const updateApiUserSettingsValidator = [
    body('id').notEmpty().isString().withMessage('id must be a non-empty string'),
    body('limitAmount').optional().isInt({min: 1}).withMessage('limitAmount must be a number'),
    body('limitTimeRange').optional().isString().isIn(['weekly', 'monthly']).withMessage("limitTimeRange must be a string and one of 'weekly', 'monthly'"),
    body('active').optional().isBoolean().withMessage('active must be a boolean'),
    body().custom((value) => {
        logger.info('validation value', {value})
        const { limitAmount, limitTimeRange, active } = value;
        
        if (!limitAmount && !limitTimeRange && active === undefined) {
            throw new Error('At least one field (limitAmount, limitTimeRange, or active) must be provided');
        }
        
        return true; // Validation passed
    }),
]


export const apiUserValidators = {
    updateApiUserSettingsValidator
}