import express from 'express';
import { paymentController } from '../../../Controllers/payment/limsPayment.controller';
import { paymentValidators } from '../../../validators/payment.validators';
import checkValidationErrors, { checkValidationErrorsWithEncryptedResponse } from '../../../middleware/validation.middleware';
import { payloadDecryptionMiddleware } from './../../../middleware/payloadDecryption.middleware'
import paymentAuthorizationValidationMiddleware from '../../../middleware/paymentAuthorizationValidation.middleware';
import adminAuthorizationMiddleware from '../../../middleware/adminAuthorization.middleware';
// import adminAuthorizationMiddleware from '../../../middleware/adminAuthorization.middleware';

const router = express.Router();

router.post(
    '/make-upi-payment',
    paymentValidators.encryptedPayloadValidator,
    checkValidationErrors,
    paymentAuthorizationValidationMiddleware,
    payloadDecryptionMiddleware,
    paymentValidators.makeUpiPaymentValidator,
    checkValidationErrorsWithEncryptedResponse,
    paymentController.upiPaymentController
);
router.post('/check-payment-status', paymentController.paymentStatusController);
router.get(
    '/get-all-transactions',
    adminAuthorizationMiddleware,
    paymentValidators.getAllTransactionsValidator,
    checkValidationErrors,
    paymentController.getAllTransactions
);

router.post(
    '/get-graph-data',
    adminAuthorizationMiddleware,
    paymentValidators.getGraphDataValidator,
    checkValidationErrors,
    paymentController.getGraphDataController
);


export default router;
