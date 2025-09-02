import { query, body } from 'express-validator';

const getAllTransactionsValidator = [
    query('page').optional().isInt().withMessage('page must be an integer'),
    query('limit').optional().isInt().withMessage('limit must be an integer'),
    query('status')
        .optional()
        .isString()
        .isIn(['Initiated', 'Pending', 'Success', 'Failure'])
        .withMessage(
            'status must be a string and one of "Initiated", "Pending", "Success", "Failure"'
        ),
    query('paymentMethod')
        .optional()
        .isString()
        .isIn(['NEFT', 'RTGS', 'IMPS', 'UPI'])
        .withMessage('paymentMethod must be a string'),
    query('searchString')
        .optional()
        .isString()
        .withMessage('searchString must be a string'),
    query('searchType')
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
        .withMessage(
            "searchType must be a valid string and one of 'payloadRefId', 'informationId', 'paymentRefNo', 'phoneNo', 'payingTo.wbpId', 'payingFrom.wbpId'"
        ),
];

const getGraphDataValidator = [
    body('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid iso date'),
    body('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid iso date'),
    body('type')
        .notEmpty()
        .isString()
        .isIn(['district', 'status', 'paymentMethod', 'amount'])
        .withMessage(
            'type must be one of "district", "status", "paymentMethod", "amount"'
        ),
];

const makeUpiPaymentValidator = [
    // rewardedBy validation
    body('rewardedBy')
        .exists()
        .withMessage('rewardedBy is required')
        .isObject()
        .withMessage('rewardedBy must be an object'),
    body('rewardedBy.wbpId')
        .exists()
        .withMessage('rewardedBy.wbpId is required')
        .isString()
        .withMessage('rewardedBy.wbpId must be a string')
        .notEmpty()
        .withMessage('rewardedBy.wbpId cannot be empty'),
    body('rewardedBy.name')
        .exists()
        .withMessage('rewardedBy.name is required')
        .isString()
        .withMessage('rewardedBy.name must be a string')
        .notEmpty()
        .withMessage('rewardedBy.name cannot be empty'),
    body('rewardedBy.designation')
        .exists()
        .withMessage('rewardedBy.designation is required')
        .isString()
        .withMessage('rewardedBy.designation must be a string')
        .notEmpty()
        .withMessage('rewardedBy.designation cannot be empty'),
    body('rewardedBy.accountNo')
        .optional()
        .isString()
        .withMessage('rewardedBy.accountNo must be a string')
        .notEmpty()
        .withMessage('rewardedBy.accountNo cannot be empty')
        .isLength({ min: 10 })
        .withMessage('Account number must be at least 10 characters'),

    // rewardedTo validation
    body('rewardedTo')
        .exists()
        .withMessage('rewardedTo is required')
        .isObject()
        .withMessage('rewardedTo must be an object'),
    body('rewardedTo.wbpId')
        .exists()
        .withMessage('rewardedTo.wbpId is required')
        .isString()
        .withMessage('rewardedTo.wbpId must be a string')
        .notEmpty()
        .withMessage('rewardedTo.wbpId cannot be empty'),
    body('rewardedTo.name')
        .exists()
        .withMessage('rewardedTo.name is required')
        .isString()
        .withMessage('rewardedTo.name must be a string')
        .notEmpty()
        .withMessage('rewardedTo.name cannot be empty'),
    body('rewardedTo.designation')
        .exists()
        .withMessage('rewardedTo.designation is required')
        .isString()
        .withMessage('rewardedTo.designation must be a string')
        .notEmpty()
        .withMessage('rewardedTo.designation cannot be empty'),
    body('rewardedTo.upi')
        .exists()
        .withMessage('rewardedTo.upi is required')
        .isString()
        .withMessage('rewardedTo.upi must be a string')
        .notEmpty()
        .withMessage('rewardedTo.upi cannot be empty'),

    // Contact info validation
    body('phoneNo')
        .optional()
        .isString()
        .withMessage('phoneNo must be a string')
        .notEmpty()
        .withMessage('phoneNo cannot be empty')
        .isMobilePhone('any')
        .withMessage('Invalid phone number format'),
    body('email')
        .optional()
        .isString()
        .withMessage('email must be a string')
        .notEmpty()
        .withMessage('email cannot be empty')
        .isEmail()
        .withMessage('Invalid email format'),

    // Payment info validation
    body('amount')
        .notEmpty()
        .withMessage('amount is required')
        .isInt({ gt: 0 })
        .withMessage('amount must be a positive integer')
        .custom((value) => {
            value = parseInt(value);
            if (value === 1 || (value >= 50 && value <= 1000)) {
                return true; // Valid
            }
            throw new Error('amount must be either 1 or between 50 and 1000');
        }),
    body('districtId')
        .exists()
        .withMessage('districtId is required')
        .isString()
        .withMessage('districtId must be a string')
        .notEmpty()
        .withMessage('districtId cannot be empty'),
    body('remarks')
        .optional()
        .isString()
        .withMessage('remarks must be a string'),
    body('Token').optional().isString().withMessage('Token must be a string'),
    body('paymentMethod')
        .optional()
        .isString()
        .isIn(['UPI', 'NEFT', 'DCR'])
        .withMessage(
            'paymentMethod must be a string and one of "UPI", "NEFT", "DCR"'
        ),
];

const encryptedPayloadValidator = [
    // Validate userId
    body('userId')
        .trim()
        .notEmpty()
        .withMessage('User ID is required')
        .isString()
        .withMessage('User ID must be a string')
        .isLength({ min: 4, max: 64 })
        .withMessage('User ID must be 8-64 characters'),

    // Validate password
    body('password')
        .trim()
        .notEmpty()
        .withMessage('Password is required')
        .isString()
        .withMessage('Password must be a string')
        .isLength({ min: 4 })
        .withMessage('Password must be at least 12 characters'),

    // Validate apiKey
    body('apiKey')
        .trim()
        .notEmpty()
        .withMessage('API key is required')
        .isString()
        .withMessage('API key must be a string')
        .isLength({ min: 4, max: 64 })
        .withMessage('API key must be 32-64 characters'),
];

export const paymentValidators = {
    getAllTransactionsValidator,
    getGraphDataValidator,
    makeUpiPaymentValidator,
    encryptedPayloadValidator,
};
