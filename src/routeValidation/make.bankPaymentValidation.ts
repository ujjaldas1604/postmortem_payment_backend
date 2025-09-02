import { body } from 'express-validator';
const validationRules = {
makeBankPayment:[body('rewardedTo').notEmpty().withMessage('rewardedTo is required'),
    body('Amount').notEmpty().withMessage('Amount is required'),
    body('InformationID').notEmpty().withMessage('InformationID is required')
]

};

export default validationRules;
