"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../../../Controllers/admin/admin.controller");
const admin_validators_1 = require("../../../validators/admin.validators");
const adminAuthorization_middleware_1 = __importDefault(require("../../../middleware/adminAuthorization.middleware"));
const router = (0, express_1.Router)();
router.post('/login-send-otp', admin_controller_1.adminController.adminLoginSendOtpController);
router.post('/login-verify-otp', admin_controller_1.adminController.adminLoginVerifyOtpController);
router.post('/login', admin_validators_1.adminValidators.adminLoginValidator, admin_controller_1.adminController.adminLoginController);
router.post('/change-password', adminAuthorization_middleware_1.default, admin_validators_1.adminValidators.adminChangePasswordValidator, admin_controller_1.adminController.adminChangePasswordController);
exports.default = router;
//# sourceMappingURL=index.js.map