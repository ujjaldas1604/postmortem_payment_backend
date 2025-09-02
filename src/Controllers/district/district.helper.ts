import logger from "../../config/winston_logger";
import { DistrictPaymentLimitModel } from "../../Models/districtPaymentLimit.model";


const getDistrictListHelper = async () => {
    try {
        logger.info(`getDistrictListHelper helper function hit`)
        const data = await DistrictPaymentLimitModel.aggregate([
            {
                $lookup: {
                    from: 'payments',
                    let: { districtName: '$name' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {
                                            $eq: [
                                                '$payingFrom.name',
                                                '$$districtName',
                                            ],
                                        },
                                        {
                                            $gte: [
                                                '$created_at',
                                                new Date(
                                                    new Date().getFullYear(),
                                                    new Date().getMonth(),
                                                    1
                                                ),
                                            ],
                                        },
                                        {
                                            $lt: [
                                                '$created_at',
                                                new Date(
                                                    new Date().getFullYear(),
                                                    new Date().getMonth() + 1,
                                                    1
                                                ),
                                            ],
                                        },
                                        {
                                            $eq: [
                                                {
                                                    $arrayElemAt: [
                                                        '$status.status',
                                                        -1,
                                                    ],
                                                }, // last status
                                                'Success',
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                totalMonthlyAmount: { $sum: '$amount' },
                            },
                        },
                    ],
                    as: 'monthlyPayments',
                },
            },
            {
                $project: {
                    name: 1,
                    limitAmount: 1,
                    amountUsed: {
                        $ifNull: [
                            {
                                $arrayElemAt: [
                                    '$monthlyPayments.totalMonthlyAmount',
                                    0,
                                ],
                            },
                            0,
                        ],
                    },
                    active: 1,
                },
            },
        ]);

        return {
            error: false,
            message: 'Data fetched successfully',
            data: data
        }
    } catch (err: any) {
        logger.error(`Error in getDistrictListHelper helper: ${err}`)
        return {
            error: true,
            message: err.message || "Error in getDistrictListHelper helper",
        }
    }
}

const updateDistrictActiveStatusHelper = async (id: string, activeStatus: boolean) => {
    try {
        logger.info(`updateDistrictActiveStatusHelper helper function hit: ${JSON.stringify({ id, activeStatus })}`)
    
        const data = await DistrictPaymentLimitModel.findOneAndUpdate({ _id: id }, { $set: { active: activeStatus, updatedAt: new Date() } })
        if (!data) {
            return {
                error: true,
                message: 'Data not found',
                data: null
            }
        }
        return {
            error: false,
            message: `${data.name} active status has been set to ${activeStatus}`,
            data: null
        }
    } catch (err: any) {
        logger.error(`Error in updateDistrictActiveStatusHelper helper: ${err}`)
        return {
            error: true,
            message: err.message || "Error in updateDistrictActiveStatusHelper helper",
        }
    }
}

const updateDistrictMonthlyLimitHelper = async (id: string, limitAmount: number) => {
    try {
        logger.info(`updateDistrictMonthlyLimitHelper helper function hit: ${JSON.stringify({ id, limitAmount })}`)
        const data = await DistrictPaymentLimitModel.findOneAndUpdate({ _id: id }, { $set: { limitAmount } })

        console.log("data", data)
        if (!data) {
            return {
                error: true,
                message: 'Data not found',
                data: null
            }
        }
        return {
            error: false,
            message: `${data.name} monthly limit has been set to ${limitAmount}`,
            data: null
        }
    } catch (err: any) {
        logger.error(`Error in updateDistrictMonthlyLimitHelper helper: ${err}`)
        return {
            error: true,
            message: err.message || "Error in updateDistrictMonthlyLimitHelper helper",
        }
    }
}

const createNewDistrictHelper = async(name: string, limitAmount: number, activeStatus: boolean) => {
    try {
        logger.info(`createNewDistrictHelper helper function hit: ${JSON.stringify({ name, limitAmount, activeStatus })}`)
        const data = await DistrictPaymentLimitModel.create({ name, limitAmount, active: activeStatus })
        return {
            error: false,
            message: 'District created successfully',
            data: data
        }
    } catch (err: any) {
        logger.error(`Error in createNewDistrictHelper helper: ${err}`)
        return {
            error: true,
            message: err.message || "Error in createNewDistrictHelper helper",
        }
    }
}

export const districtHelper = {
    getDistrictListHelper,
    updateDistrictActiveStatusHelper,
    updateDistrictMonthlyLimitHelper,
    createNewDistrictHelper
}