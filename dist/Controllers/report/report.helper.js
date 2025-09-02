"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportHelper = void 0;
const winston_logger_1 = __importDefault(require("../../config/winston_logger"));
const payments_model_1 = require("../../Models/payments.model");
const paymentReportHelper = async (startDate, endDate) => {
    try {
        winston_logger_1.default.info(`paymentReportHelper function hit: ${JSON.stringify({
            startDate,
            endDate,
        })}`);
        const results = await payments_model_1.PaymentModel.aggregate([
            {
                $project: {
                    id: 1,
                    payloadRefId: 1,
                    informationId: 1,
                    payingFrom: '$payingFrom.name',
                    amount: 1,
                    payingToName: '$payingTo.name',
                    lastStatus: { $arrayElemAt: ['$status', -1] },
                },
            },
        ]);
        const listResult = results.map((result) => {
            return {
                'payment Id': result.payloadRefId,
                'Information Id': result.informationId,
                'Paying From': result.payingFrom,
                'Paying To': result.payingToName,
                amount: result.amount,
                status: result.lastStatus.status,
                date: result.lastStatus.date.toLocaleString(),
            };
        });
        return {
            error: false,
            data: listResult,
        };
    }
    catch (err) {
        winston_logger_1.default.error(`Error in paymentReportHelper utils function: ${err?.message}`);
        return {
            error: true,
            message: `Error in paymentReportHelper utils function: ${err?.message}`,
        };
    }
};
const groupedPaymentReportHelper = async (startDate, endDate) => {
    try {
        winston_logger_1.default.info(`groupedPaymentReportHelper function hit: ${JSON.stringify({
            startDate,
            endDate,
        })}`);
        const results = await payments_model_1.PaymentModel.aggregate([
            {
                $addFields: {
                    lastStatus: { $arrayElemAt: ['$status.status', -1] },
                },
            },
            {
                $group: {
                    _id: '$payingFrom.name',
                    payingFromName: { $first: '$payingFrom.name' },
                    totalAmount: { $sum: '$amount' },
                    totalAmountSuccess: {
                        $sum: {
                            $cond: [
                                { $eq: ['$lastStatus', 'Success'] },
                                '$amount',
                                0,
                            ],
                        },
                    },
                    totalAmountFailed: {
                        $sum: {
                            $cond: [
                                { $eq: ['$lastStatus', 'Failure'] },
                                '$amount',
                                0,
                            ],
                        },
                    },
                    totalCountSuccess: {
                        $sum: {
                            $cond: [{ $eq: ['$lastStatus', 'Success'] }, 1, 0],
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    payingFromName: 1,
                    totalAmount: 1,
                    totalAmountSuccess: 1,
                    totalAmountFailed: 1,
                    totalCountSuccess: 1,
                },
            },
        ]);
        const listResult = results.map((result, i) => {
            return {
                'Sl. No.': i + 1,
                'Name of Unit': result.payingFromName,
                'Reward Spent By Dist. in Rs.': `${result.totalAmountSuccess.toLocaleString()}/-`,
                'No. Of CV & VP Rewarded': result.totalCountSuccess,
            };
        });
        return {
            error: false,
            data: listResult,
        };
    }
    catch (err) {
        winston_logger_1.default.error(`Error in groupedPaymentReportHelper utils function: ${err?.message}`);
        return {
            error: true,
            message: `Error in groupedPaymentReportHelper utils function: ${err?.message}`,
        };
    }
};
exports.reportHelper = {
    paymentReportHelper,
    groupedPaymentReportHelper,
};
//# sourceMappingURL=report.helper.js.map