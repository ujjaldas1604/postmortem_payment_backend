"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminValidators = void 0;
const express_validator_1 = require("express-validator");
const adminLoginValidator = [
    (0, express_validator_1.body)('userName')
        .notEmpty()
        .isString()
        .withMessage('userName must be a non-empty string'),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .isString()
        .withMessage('password must be a non-empty string'),
];
const adminChangePasswordValidator = [
    (0, express_validator_1.body)('oldPassword')
        .notEmpty()
        .isString()
        .withMessage('oldPassword must be a non-empty string'),
    (0, express_validator_1.body)('newPassword')
        .notEmpty()
        .isString()
        .withMessage('newPassword must be a non-empty string'),
];
exports.adminValidators = {
    adminLoginValidator,
    adminChangePasswordValidator,
};
//# sourceMappingURL=admin.validators.js.map