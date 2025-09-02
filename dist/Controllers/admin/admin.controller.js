"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = void 0;
const winston_logger_1 = __importDefault(require("../../config/winston_logger"));
const admin_helper_1 = require("./admin.helper");
const generate_utils_1 = require("../../utils/generate.utils");
const config_1 = require("../../config/config");
const admin_model_1 = require("../../Models/admin.model");
const password_utils_1 = require("../../utils/password.utils");
const adminLoginSendOtpController = async (req, res) => {
    try {
        winston_logger_1.default.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body,
        });
        const { phone } = req.body;
        const admin = await admin_helper_1.adminHelper.adminLoginSendOtpHelper(phone);
        res.status(200).json({
            message: 'Otp successfully sent to the admin with given phone number',
            data: admin,
        });
    }
    catch (err) {
        winston_logger_1.default.error(`Error in adminLoginController: ${err}`);
        res.status(500).json({
            message: err.message || 'Internal Server Error',
        });
    }
};
const adminLoginVerifyOtpController = async (req, res) => {
    try {
        winston_logger_1.default.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body,
        });
        const { phone, otp } = req.body;
        const admin = await admin_helper_1.adminHelper.adminLoginVerifyOtpHelper(phone, otp);
        const accessToken = generate_utils_1.generateUtils.generateAccessToken({
            id: admin.id,
            type: 'ADMIN',
        }, config_1.config.JWT_ACCESS_TOKEN_SECRET || 'hard-to-crack-secret');
        res.status(200).json({
            message: 'Admin successfully logged in',
            data: {
                name: admin.name,
                accessToken,
            },
        });
    }
    catch (err) {
        winston_logger_1.default.error(`Error in adminLoginController: ${err}`);
        res.status(500).json({
            message: err.message || 'Internal Server Error',
        });
    }
};
const adminLoginController = async (req, res) => {
    try {
        winston_logger_1.default.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body,
        });
        const { userName, password } = req.body;
        let admin = await admin_model_1.AdminModel.findOne({ userName });
        if (!admin) {
            res.status(400).json({
                error: true,
                message: 'Admin not found',
            });
            return;
        }
        admin = await admin_model_1.AdminModel.findOne({ userName });
        if (!admin) {
            res.status(400).json({
                error: true,
                message: 'Admin not found',
            });
            return;
        }
        if (!(await password_utils_1.passwordUtils.verifyPassword(password, admin.password))) {
            res.status(400).json({
                error: true,
                message: 'Incorrect password',
            });
            return;
        }
        const accessToken = generate_utils_1.generateUtils.generateAccessToken({
            id: admin.id,
            type: 'ADMIN',
        }, config_1.config.JWT_ACCESS_TOKEN_SECRET || 'hard-to-crack-secret');
        res.status(200).json({
            data: {
                name: admin.name,
                accessToken,
            },
        });
        return;
    }
    catch (err) {
        winston_logger_1.default.error(`Error in adminLoginController: ${err}`);
        res.status(500).json({
            message: err.message || 'Internal Server Error',
        });
        return;
    }
};
const adminChangePasswordController = async (req, res) => {
    try {
        winston_logger_1.default.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body,
        });
        const { oldPassword, newPassword } = req.body;
        if (!req?.admin?.id) {
            res.status(400).json({
                error: true,
                message: 'unauthorized',
            });
            return;
        }
        const admin = await admin_model_1.AdminModel.findOne({ id: req?.admin?.id });
        if (!admin) {
            res.status(400).json({
                error: true,
                message: 'Admin not found',
            });
            return;
        }
        if (!(await password_utils_1.passwordUtils.verifyPassword(oldPassword, admin.password))) {
            res.status(400).json({
                error: true,
                message: 'Incorrect password',
            });
            return;
        }
        const hashedPassword = await password_utils_1.passwordUtils.hashPassword(newPassword);
        admin.password = hashedPassword;
        await admin.save();
        res.status(200).json({
            message: 'Password changed successfully',
        });
        return;
    }
    catch (err) {
        winston_logger_1.default.error(`Error in adminChangePasswordController: ${err}`);
        res.status(500).json({
            message: err.message || 'Internal Server Error',
        });
    }
};
exports.adminController = {
    adminLoginSendOtpController,
    adminLoginVerifyOtpController,
    adminLoginController,
    adminChangePasswordController,
};
//# sourceMappingURL=admin.controller.js.map