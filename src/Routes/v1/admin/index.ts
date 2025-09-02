import { Router } from "express";
import { adminController } from "../../../Controllers/admin/admin.controller";
import { adminValidators } from "../../../validators/admin.validators";
import adminAuthorizationMiddleware from "../../../middleware/adminAuthorization.middleware";

const router = Router();

router.post('/login-send-otp', adminController.adminLoginSendOtpController);
router.post('/login-verify-otp', adminController.adminLoginVerifyOtpController);
router.post('/login',adminValidators.adminLoginValidator, adminController.adminLoginController);
router.post('/change-password',adminAuthorizationMiddleware, adminValidators.adminChangePasswordValidator, adminController.adminChangePasswordController);

export default router