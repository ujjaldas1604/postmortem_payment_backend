import express from 'express';
import { apiUsersController } from '../../../Controllers/apiUsers/apiUsers.controller';
import { apiUserValidators } from '../../../validators/apiUser.validators';
import checkValidationErrors from '../../../middleware/validation.middleware';
import adminAuthorizationMiddleware from '../../../middleware/adminAuthorization.middleware';

const router = express.Router();

router.post(
    '/get-all-api-users',
    adminAuthorizationMiddleware,
    apiUsersController.getAllApiUsers
);
router.post(
    '/update-settings',
    adminAuthorizationMiddleware,
    apiUserValidators.updateApiUserSettingsValidator,
    checkValidationErrors,
    apiUsersController.updateApiUserSettingsController
);

export default router;
