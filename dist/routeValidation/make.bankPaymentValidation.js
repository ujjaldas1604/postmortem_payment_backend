"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const validationRules = {
    makeBankPayment: [(0, express_validator_1.body)('rewardedTo').notEmpty().withMessage('rewardedTo is required'),
        (0, express_validator_1.body)('Amount').notEmpty().withMessage('Amount is required'),
        (0, express_validator_1.body)('InformationID').notEmpty().withMessage('InformationID is required')
    ]
};
exports.default = validationRules;
//# sourceMappingURL=make.bankPaymentValidation.js.map