import { Request, Response } from 'express';
import logger from '../../config/winston_logger';
import { adminHelper } from './admin.helper';
import { generateUtils } from '../../utils/generate.utils';
import { config } from '../../config/config';
import { AdminModel } from '../../Models/admin.model';
import { passwordUtils } from '../../utils/password.utils';
import { IRequestWithAdminCreds } from '../../interface/global.interface';

const adminLoginSendOtpController = async (req: Request, res: Response) => {
    try {
        logger.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body,
        });
        const { phone } = req.body;
        const admin = await adminHelper.adminLoginSendOtpHelper(phone);
        res.status(200).json({
            message:
                'Otp successfully sent to the admin with given phone number',
            data: admin,
        });
    } catch (err: any) {
        logger.error(`Error in adminLoginController: ${err}`);
        res.status(500).json({
            message: err.message || 'Internal Server Error',
        });
    }
};

const adminLoginVerifyOtpController = async (req: Request, res: Response) => {
    try {
        logger.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body,
        });
        const { phone, otp } = req.body;
        const admin = await adminHelper.adminLoginVerifyOtpHelper(phone, otp);
        // console.log(admin)

        const accessToken = generateUtils.generateAccessToken(
            {
                id: admin.id,
                type: 'ADMIN',
            },
            config.JWT_ACCESS_TOKEN_SECRET || 'hard-to-crack-secret'
        );

        res.status(200).json({
            message: 'Admin successfully logged in',
            data: {
                name: admin.name,
                accessToken,
            },
        });
    } catch (err: any) {
        logger.error(`Error in adminLoginController: ${err}`);
        res.status(500).json({
            message: err.message || 'Internal Server Error',
        });
    }
};

const adminLoginController = async (req: Request, res: Response) => {
    try {
        logger.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body,
        });
        const { userName, password } = req.body;
        let admin = await AdminModel.findOne({ userName });

        if (!admin) {
            res.status(400).json({
                error: true,
                message: 'Admin not found',
            });
            return;
        }

        admin = await AdminModel.findOne({ userName });
        if (!admin) {
            res.status(400).json({
                error: true,
                message: 'Admin not found',
            });
            return;
        }

        if (!(await passwordUtils.verifyPassword(password, admin.password))) {
            res.status(400).json({
                error: true,
                message: 'Incorrect password',
            });
            return;
        }

        const accessToken = generateUtils.generateAccessToken(
            {
                id: admin.id,
                type: 'ADMIN',
            },
            config.JWT_ACCESS_TOKEN_SECRET || 'hard-to-crack-secret'
        );

        res.status(200).json({
            data: {
                name: admin.name,
                accessToken,
            },
        });
        return;
    } catch (err: any) {
        logger.error(`Error in adminLoginController: ${err}`);
        res.status(500).json({
            message: err.message || 'Internal Server Error',
        });
        return;
    }
};

const adminChangePasswordController = async (
    req: IRequestWithAdminCreds,
    res: Response
) => {
    try {
        logger.info('Incoming request', {
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
        const admin = await AdminModel.findOne({ id: req?.admin?.id });
        if (!admin) {
            res.status(400).json({
                error: true,
                message: 'Admin not found',
            });
            return;
        }
        if (!(await passwordUtils.verifyPassword(oldPassword, admin.password))) {
            res.status(400).json({
                error: true,
                message: 'Incorrect password',
            });
            return;
        }
        const hashedPassword = await passwordUtils.hashPassword(newPassword);
        admin.password = hashedPassword;
        await admin.save();
        res.status(200).json({
            message: 'Password changed successfully',
        });
        return;
    } catch (err: any) {
        logger.error(`Error in adminChangePasswordController: ${err}`);
        res.status(500).json({
            message: err.message || 'Internal Server Error',
        });
    }
};

export const adminController = {
    adminLoginSendOtpController,
    adminLoginVerifyOtpController,
    adminLoginController,
    adminChangePasswordController,
};
