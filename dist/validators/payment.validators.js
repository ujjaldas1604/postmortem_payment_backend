"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentValidators = void 0;
const express_validator_1 = require("express-validator");
const getAllTransactionsValidator = [
    (0, express_validator_1.query)('page').optional().isInt().withMessage('page must be an integer'),
    (0, express_validator_1.query)('limit').optional().isInt().withMessage('limit must be an integer'),
    (0, express_validator_1.query)('status')
        .optional()
        .isString()
        .isIn(['Initiated', 'Pending', 'Success', 'Failure'])
        .withMessage('status must be a string and one of "Initiated", "Pending", "Success", "Failure"'),
    (0, express_validator_1.query)('paymentMethod')
        .optional()
        .isString()
        .isIn(['NEFT', 'RTGS', 'IMPS', 'UPI'])
        .withMessage('paymentMethod must be a string'),
    (0, express_validator_1.query)('searchString')
        .optional()
        .isString()
        .withMessage('searchString must be a string'),
    (0, express_validator_1.query)('searchType')
        .optional()
        .isString()
        .isIn([
        'payloadRefId',
        'informationId',
        'paymentRefNo',
        'phoneNo',
        'payingTo.wbpId',
        'payingFrom.wbpId',
    ])
        .withMessage("searchType must be a valid string and one of 'payloadRefId', 'informationId', 'paymentRefNo', 'phoneNo', 'payingTo.wbpId', 'payingFrom.wbpId'"),
];
const getGraphDataValidator = [
    (0, express_validator_1.body)('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid iso date'),
    (0, express_validator_1.body)('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid iso date'),
    (0, express_validator_1.body)('type')
        .notEmpty()
        .isString()
        .isIn(['district', 'status', 'paymentMethod', 'amount'])
        .withMessage('type must be one of "district", "status", "paymentMethod", "amount"'),
];
const makeUpiPaymentValidator = [
    (0, express_validator_1.body)('rewardedBy')
        .exists()
        .withMessage('rewardedBy is required')
        .isObject()
        .withMessage('rewardedBy must be an object'),
    (0, express_validator_1.body)('rewardedBy.wbpId')
        .exists()
        .withMessage('rewardedBy.wbpId is required')
        .isString()
        .withMessage('rewardedBy.wbpId must be a string')
        .notEmpty()
        .withMessage('rewardedBy.wbpId cannot be empty'),
    (0, express_validator_1.body)('rewardedBy.name')
        .exists()
        .withMessage('rewardedBy.name is required')
        .isString()
        .withMessage('rewardedBy.name must be a string')
        .notEmpty()
        .withMessage('rewardedBy.name cannot be empty'),
    (0, express_validator_1.body)('rewardedBy.designation')
        .exists()
        .withMessage('rewardedBy.designation is required')
        .isString()
        .withMessage('rewardedBy.designation must be a string')
        .notEmpty()
        .withMessage('rewardedBy.designation cannot be empty'),
    (0, express_validator_1.body)('rewardedBy.accountNo')
        .optional()
        .isString()
        .withMessage('rewardedBy.accountNo must be a string')
        .notEmpty()
        .withMessage('rewardedBy.accountNo cannot be empty')
        .isLength({ min: 10 })
        .withMessage('Account number must be at least 10 characters'),
    (0, express_validator_1.body)('rewardedTo')
        .exists()
        .withMessage('rewardedTo is required')
        .isObject()
        .withMessage('rewardedTo must be an object'),
    (0, express_validator_1.body)('rewardedTo.wbpId')
        .exists()
        .withMessage('rewardedTo.wbpId is required')
        .isString()
        .withMessage('rewardedTo.wbpId must be a string')
        .notEmpty()
        .withMessage('rewardedTo.wbpId cannot be empty'),
    (0, express_validator_1.body)('rewardedTo.name')
        .exists()
        .withMessage('rewardedTo.name is required')
        .isString()
        .withMessage('rewardedTo.name must be a string')
        .notEmpty()
        .withMessage('rewardedTo.name cannot be empty'),
    (0, express_validator_1.body)('rewardedTo.designation')
        .exists()
        .withMessage('rewardedTo.designation is required')
        .isString()
        .withMessage('rewardedTo.designation must be a string')
        .notEmpty()
        .withMessage('rewardedTo.designation cannot be empty'),
    (0, express_validator_1.body)('rewardedTo.upi')
        .exists()
        .withMessage('rewardedTo.upi is required')
        .isString()
        .withMessage('rewardedTo.upi must be a string')
        .notEmpty()
        .withMessage('rewardedTo.upi cannot be empty'),
    (0, express_validator_1.body)('phoneNo')
        .optional()
        .isString()
        .withMessage('phoneNo must be a string')
        .notEmpty()
        .withMessage('phoneNo cannot be empty')
        .isMobilePhone('any')
        .withMessage('Invalid phone number format'),
    (0, express_validator_1.body)('email')
        .optional()
        .isString()
        .withMessage('email must be a string')
        .notEmpty()
        .withMessage('email cannot be empty')
        .isEmail()
        .withMessage('Invalid email format'),
    (0, express_validator_1.body)('amount')
        .notEmpty()
        .withMessage('amount is required')
        .isInt({ gt: 0 })
        .withMessage('amount must be a positive integer')
        .custom((value) => {
        value = parseInt(value);
        if (value === 1 || (value >= 50 && value <= 1000)) {
            return true;
        }
        throw new Error('amount must be either 1 or between 50 and 1000');
    }),
    (0, express_validator_1.body)('districtId')
        .exists()
        .withMessage('districtId is required')
        .isString()
        .withMessage('districtId must be a string')
        .notEmpty()
        .withMessage('districtId cannot be empty'),
    (0, express_validator_1.body)('remarks')
        .optional()
        .isString()
        .withMessage('remarks must be a string'),
    (0, express_validator_1.body)('Token').optional().isString().withMessage('Token must be a string'),
    (0, express_validator_1.body)('paymentMethod')
        .optional()
        .isString()
        .isIn(['UPI', 'NEFT', 'DCR'])
        .withMessage('paymentMethod must be a string and one of "UPI", "NEFT", "DCR"'),
];
const encryptedPayloadValidator = [
    (0, express_validator_1.body)('userId')
        .trim()
        .notEmpty()
        .withMessage('User ID is required')
        .isString()
        .withMessage('User ID must be a string')
        .isLength({ min: 4, max: 64 })
        .withMessage('User ID must be 8-64 characters'),
    (0, express_validator_1.body)('password')
        .trim()
        .notEmpty()
        .withMessage('Password is required')
        .isString()
        .withMessage('Password must be a string')
        .isLength({ min: 4 })
        .withMessage('Password must be at least 12 characters'),
    (0, express_validator_1.body)('apiKey')
        .trim()
        .notEmpty()
        .withMessage('API key is required')
        .isString()
        .withMessage('API key must be a string')
        .isLength({ min: 4, max: 64 })
        .withMessage('API key must be 32-64 characters'),
];
exports.paymentValidators = {
    getAllTransactionsValidator,
    getGraphDataValidator,
    makeUpiPaymentValidator,
    encryptedPayloadValidator,
};
//# sourceMappingURL=payment.validators.js.map