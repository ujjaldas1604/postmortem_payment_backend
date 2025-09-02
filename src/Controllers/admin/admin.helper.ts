import { config } from "../../config/config"
import logger from "../../config/winston_logger"
import { AdminModel } from "../../Models/admin.model"

const adminLoginSendOtpHelper = async (phone: string) => {
    try {
        logger.info(`adminLoginSendOtpHelper helper function hit: ${phone}`)
        const admin = await AdminModel.findOne({ phone: phone })
        if (!admin) {
            logger.error(`Admin not found`)
            throw Error('No Admin found with the given phone number');
        }
        if (admin.otp && admin.otpGenerationTime && admin.otpGenerationTime.getTime() + config.ADMIN_OTP_COOLDOWN > new Date().getTime()) {
            logger.error(`Otp cool down error, time remaining:${(admin.otpGenerationTime.getTime() + config.ADMIN_OTP_COOLDOWN - new Date().getTime()) / 1000} seconds`)
            throw Error(`Otp cool down error, please wait for ${(admin.otpGenerationTime.getTime() + config.ADMIN_OTP_COOLDOWN - new Date().getTime()) / 1000} seconds before resending the otp`);
        }
        const generatedOtp = 666666; // Math.floor(Math.random() * 10000);
        await AdminModel.updateOne({ phone: phone }, {
            $set: {
                otp: generatedOtp,
                otpGenerationTime: new Date()
            }
        })

        //TODO - need to send the otp with a third party service

        return "Otp sent to the phone number successfully"
    } catch (err: any) {
        logger.error(`Error in adminLoginSendOtpHelper helper: ${err}`)
        throw Error(err.message || "Error in adminLoginSendOtpHelper helper");
    }

}

const adminLoginVerifyOtpHelper = async (phone: string, otp: number) => {
    try {
        logger.info(`adminLoginVerifyOtpHelper helper function hit: ${JSON.stringify({ phone, otp })}`)
        const admin = await AdminModel.findOne({ phone: phone })
        if (!admin) {
            logger.error(`Admin not found`)
            throw Error('No Admin found with the given phone number');
        }

        if (!admin.otp || !admin.otpGenerationTime) {
            logger.error(`Otp not found`)
            throw Error('Otp not found');
        }

        if (admin.otpGenerationTime.getTime() + config.ADMIN_OTP_TIMEOUT < new Date().getTime()) {
            logger.error(`Otp is expired`)
            throw Error('Otp is expired');
        }

        if (admin.otp !== otp) {
            logger.error(`Otp not matched`)
            throw Error('Invalid Otp Provided');
        }
        return admin
    } catch (err: any) {
        logger.error(`Error in adminLoginVerifyOtpHelper helper: ${err}`)
        throw Error(err.message || "Error in adminLoginVerifyOtpHelper helper");
    }
}

export const adminHelper = {
    adminLoginSendOtpHelper,
    adminLoginVerifyOtpHelper
}