"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiUserValidators = void 0;
const express_validator_1 = require("express-validator");
const winston_logger_1 = __importDefault(require("../config/winston_logger"));
const updateApiUserSettingsValidator = [
    (0, express_validator_1.body)('id').notEmpty().isString().withMessage('id must be a non-empty string'),
    (0, express_validator_1.body)('limitAmount').optional().isInt({ min: 1 }).withMessage('limitAmount must be a number'),
    (0, express_validator_1.body)('limitTimeRange').optional().isString().isIn(['weekly', 'monthly']).withMessage("limitTimeRange must be a string and one of 'weekly', 'monthly'"),
    (0, express_validator_1.body)('active').optional().isBoolean().withMessage('active must be a boolean'),
    (0, express_validator_1.body)().custom((value) => {
        winston_logger_1.default.info('validation value', { value });
        const { limitAmount, limitTimeRange, active } = value;
        if (!limitAmount && !limitTimeRange && active === undefined) {
            throw new Error('At least one field (limitAmount, limitTimeRange, or active) must be provided');
        }
        return true;
    }),
];
exports.apiUserValidators = {
    updateApiUserSettingsValidator
};
//# sourceMappingURL=apiUser.validators.js.map