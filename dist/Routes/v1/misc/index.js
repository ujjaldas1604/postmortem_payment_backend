"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const misc_controller_1 = require("../../../Controllers/misc/misc.controller");
const payloadDecryption_middleware_1 = require("../../../middleware/payloadDecryption.middleware");
const router = (0, express_1.Router)();
router.post('/request-encrypt-payload', misc_controller_1.miscController.encryptPayload);
router.post('/request-decrypt-payload', payloadDecryption_middleware_1.payloadDecryptionMiddleware, misc_controller_1.miscController.decryptPayload);
router.post('/response-encrypt-payload', misc_controller_1.miscController.responsePayloadEncrypt);
router.post('/response-decrypt-payload', misc_controller_1.miscController.encryptPayload);
exports.default = router;
//# sourceMappingURL=index.js.map