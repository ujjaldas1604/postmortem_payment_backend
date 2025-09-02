"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkValidationErrorsWithEncryptedResponse = void 0;
const express_validator_1 = require("express-validator");
const winston_logger_1 = __importDefault(require("../config/winston_logger"));
const limsPayment_helper_1 = require("../Controllers/payment/limsPayment.helper");
const checkValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const messages = [];
        errors.array().forEach((err) => {
            if (err.msg !== 'Invalid value') {
                messages.push(err.msg);
            }
        });
        winston_logger_1.default.error(`Validation error: ${JSON.stringify(errors.array())}`);
        const response = {
            error: true,
            message: messages.join(', ')
        };
        res.status(400).json(response);
        return;
    }
    else {
        next();
    }
};
const checkValidationErrorsWithEncryptedResponse = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const messages = [];
        errors.array().forEach((err) => {
            if (err.msg !== 'Invalid value') {
                messages.push(err.msg);
            }
        });
        winston_logger_1.default.error(`Validation error: ${JSON.stringify(errors.array())}`);
        res.status(400).json(limsPayment_helper_1.paymentHelper.encryptPaymentResponse({
            error: true,
            message: messages.join(', '),
        }));
        return;
    }
    else {
        next();
    }
};
exports.checkValidationErrorsWithEncryptedResponse = checkValidationErrorsWithEncryptedResponse;
exports.default = checkValidationErrors;
//# sourceMappingURL=validation.middleware.js.map