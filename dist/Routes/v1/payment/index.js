"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const limsPayment_controller_1 = require("../../../Controllers/payment/limsPayment.controller");
const payment_validators_1 = require("../../../validators/payment.validators");
const validation_middleware_1 = __importStar(require("../../../middleware/validation.middleware"));
const payloadDecryption_middleware_1 = require("src/middleware/payloadDecryption.middleware");
const paymentAuthorizationValidation_middleware_1 = __importDefault(require("../../../middleware/paymentAuthorizationValidation.middleware"));
const adminAuthorization_middleware_1 = __importDefault(require("../../../middleware/adminAuthorization.middleware"));
const router = express_1.default.Router();
router.post('/make-upi-payment', payment_validators_1.paymentValidators.encryptedPayloadValidator, validation_middleware_1.default, paymentAuthorizationValidation_middleware_1.default, payloadDecryption_middleware_1.payloadDecryptionMiddleware, payment_validators_1.paymentValidators.makeUpiPaymentValidator, validation_middleware_1.checkValidationErrorsWithEncryptedResponse, limsPayment_controller_1.paymentController.upiPaymentController);
router.post('/check-payment-status', limsPayment_controller_1.paymentController.paymentStatusController);
router.get('/get-all-transactions', adminAuthorization_middleware_1.default, payment_validators_1.paymentValidators.getAllTransactionsValidator, validation_middleware_1.default, limsPayment_controller_1.paymentController.getAllTransactions);
router.post('/get-graph-data', adminAuthorization_middleware_1.default, payment_validators_1.paymentValidators.getGraphDataValidator, validation_middleware_1.default, limsPayment_controller_1.paymentController.getGraphDataController);
exports.default = router;
//# sourceMappingURL=index.js.map