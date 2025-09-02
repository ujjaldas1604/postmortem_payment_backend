import { body } from 'express-validator';

const adminLoginValidator = [
    body('userName')
        .notEmpty()
        .isString()
        .withMessage('userName must be a non-empty string'),
    body('password')
        .notEmpty()
        .isString()
        .withMessage('password must be a non-empty string'),
];

const adminChangePasswordValidator = [
    body('oldPassword')
        .notEmpty()
        .isString()
        .withMessage('oldPassword must be a non-empty string'),
    body('newPassword')
        .notEmpty()
        .isString()
        .withMessage('newPassword must be a non-empty string'),
];

export const adminValidators = {
    adminLoginValidator,
    adminChangePasswordValidator,
};
