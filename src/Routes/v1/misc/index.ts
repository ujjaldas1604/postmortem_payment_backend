import { Router } from 'express';
import { miscController } from '../../../Controllers/misc/misc.controller';
import { payloadDecryptionMiddleware } from '../../../middleware/payloadDecryption.middleware';

const router = Router();

router.post('/request-encrypt-payload', miscController.encryptPayload);
router.post(
    '/request-decrypt-payload',
    payloadDecryptionMiddleware,
    miscController.decryptPayload
);

router.post('/response-encrypt-payload', miscController.responsePayloadEncrypt);
router.post('/response-decrypt-payload', miscController.encryptPayload);

export default router;
