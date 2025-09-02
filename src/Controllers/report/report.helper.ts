import logger from '../../config/winston_logger';
import { PaymentModel } from '../../Models/payments.model';

const paymentReportHelper = async (startDate?: string, endDate?: string) => {
    try {
        logger.info(
            `paymentReportHelper function hit: ${JSON.stringify({
                startDate,
                endDate,
            })}`
        );

        const results = await PaymentModel.aggregate([
            {
                $project: {
                    id: 1,
                    payloadRefId: 1,
                    informationId: 1,
                    payingFrom: '$payingFrom.name',
                    amount: 1,
                    // paymentMethod: 1,
                    payingToName: '$payingTo.name',
                    // payingToDesignation: '$payingTo.designation',
                    //   firstStatus: { $arrayElemAt: ["$status", 0] },
                    lastStatus: { $arrayElemAt: ['$status', -1] },
                },
            },
        ]);

        const listResult = results.map((result: any) => {
            return {
                'payment Id': result.payloadRefId,
                'Information Id': result.informationId,
                'Paying From': result.payingFrom,
                'Paying To': result.payingToName,
                amount: result.amount,
                // "Method": result.paymentMethod,
                // payingToDesignation: result.payingToDesignation,
                status: result.lastStatus.status,
                date: result.lastStatus.date.toLocaleString(),
            };
        });

        return {
            error: false,
            data: listResult,
        };
    } catch (err: any) {
        logger.error(
            `Error in paymentReportHelper utils function: ${err?.message}`
        );
        return {
            error: true,
            message: `Error in paymentReportHelper utils function: ${err?.message}`,
        };
    }
};

const groupedPaymentReportHelper = async (
    startDate?: string,
    endDate?: string
) => {
    try {
        logger.info(
            `groupedPaymentReportHelper function hit: ${JSON.stringify({
                startDate,
                endDate,
            })}`
        );

        const results = await PaymentModel.aggregate([
            {
                $addFields: {
                    lastStatus: { $arrayElemAt: ['$status.status', -1] },
                },
            },
            // Now group by payingFrom.name
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

        const listResult = results.map((result: any, i: number) => {
            return {
                'Sl. No.': i + 1,
                'Name of Unit': result.payingFromName,
                // 'Disbursed Reward Money in Rs.': `${result.totalAmount.toLocaleString()}/-`,
                'Reward Spent By Dist. in Rs.': `${result.totalAmountSuccess.toLocaleString()}/-`,
                // 'Total Amount Failed': result.totalAmountFailed,
                'No. Of CV & VP Rewarded': result.totalCountSuccess,
            };
        });

        return {
            error: false,
            data: listResult,
        };
    } catch (err: any) {
        logger.error(
            `Error in groupedPaymentReportHelper utils function: ${err?.message}`
        );
        return {
            error: true,
            message: `Error in groupedPaymentReportHelper utils function: ${err?.message}`,
        };
    }
};

export const reportHelper = {
    paymentReportHelper,
    groupedPaymentReportHelper,
};
