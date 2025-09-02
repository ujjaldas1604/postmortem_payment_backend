"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminHelper = void 0;
const config_1 = require("../../config/config");
const winston_logger_1 = __importDefault(require("../../config/winston_logger"));
const admin_model_1 = require("../../Models/admin.model");
const adminLoginSendOtpHelper = async (phone) => {
    try {
        winston_logger_1.default.info(`adminLoginSendOtpHelper helper function hit: ${phone}`);
        const admin = await admin_model_1.AdminModel.findOne({ phone: phone });
        if (!admin) {
            winston_logger_1.default.error(`Admin not found`);
            throw Error('No Admin found with the given phone number');
        }
        if (admin.otp && admin.otpGenerationTime && admin.otpGenerationTime.getTime() + config_1.config.ADMIN_OTP_COOLDOWN > new Date().getTime()) {
            winston_logger_1.default.error(`Otp cool down error, time remaining:${(admin.otpGenerationTime.getTime() + config_1.config.ADMIN_OTP_COOLDOWN - new Date().getTime()) / 1000} seconds`);
            throw Error(`Otp cool down error, please wait for ${(admin.otpGenerationTime.getTime() + config_1.config.ADMIN_OTP_COOLDOWN - new Date().getTime()) / 1000} seconds before resending the otp`);
        }
        const generatedOtp = 666666;
        await admin_model_1.AdminModel.updateOne({ phone: phone }, {
            $set: {
                otp: generatedOtp,
                otpGenerationTime: new Date()
            }
        });
        return "Otp sent to the phone number successfully";
    }
    catch (err) {
        winston_logger_1.default.error(`Error in adminLoginSendOtpHelper helper: ${err}`);
        throw Error(err.message || "Error in adminLoginSendOtpHelper helper");
    }
};
const adminLoginVerifyOtpHelper = async (phone, otp) => {
    try {
        winston_logger_1.default.info(`adminLoginVerifyOtpHelper helper function hit: ${JSON.stringify({ phone, otp })}`);
        const admin = await admin_model_1.AdminModel.findOne({ phone: phone });
        if (!admin) {
            winston_logger_1.default.error(`Admin not found`);
            throw Error('No Admin found with the given phone number');
        }
        if (!admin.otp || !admin.otpGenerationTime) {
            winston_logger_1.default.error(`Otp not found`);
            throw Error('Otp not found');
        }
        if (admin.otpGenerationTime.getTime() + config_1.config.ADMIN_OTP_TIMEOUT < new Date().getTime()) {
            winston_logger_1.default.error(`Otp is expired`);
            throw Error('Otp is expired');
        }
        if (admin.otp !== otp) {
            winston_logger_1.default.error(`Otp not matched`);
            throw Error('Invalid Otp Provided');
        }
        return admin;
    }
    catch (err) {
        winston_logger_1.default.error(`Error in adminLoginVerifyOtpHelper helper: ${err}`);
        throw Error(err.message || "Error in adminLoginVerifyOtpHelper helper");
    }
};
exports.adminHelper = {
    adminLoginSendOtpHelper,
    adminLoginVerifyOtpHelper
};
//# sourceMappingURL=admin.helper.js.map