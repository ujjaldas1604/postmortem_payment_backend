"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.districtHelper = void 0;
const winston_logger_1 = __importDefault(require("../../config/winston_logger"));
const districtPaymentLimit_model_1 = require("../../Models/districtPaymentLimit.model");
const getDistrictListHelper = async () => {
    try {
        winston_logger_1.default.info(`getDistrictListHelper helper function hit`);
        const data = await districtPaymentLimit_model_1.DistrictPaymentLimitModel.aggregate([
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
                                                new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                                            ],
                                        },
                                        {
                                            $lt: [
                                                '$created_at',
                                                new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
                                            ],
                                        },
                                        {
                                            $eq: [
                                                {
                                                    $arrayElemAt: [
                                                        '$status.status',
                                                        -1,
                                                    ],
                                                },
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
        };
    }
    catch (err) {
        winston_logger_1.default.error(`Error in getDistrictListHelper helper: ${err}`);
        return {
            error: true,
            message: err.message || "Error in getDistrictListHelper helper",
        };
    }
};
const updateDistrictActiveStatusHelper = async (id, activeStatus) => {
    try {
        winston_logger_1.default.info(`updateDistrictActiveStatusHelper helper function hit: ${JSON.stringify({ id, activeStatus })}`);
        const data = await districtPaymentLimit_model_1.DistrictPaymentLimitModel.findOneAndUpdate({ _id: id }, { $set: { active: activeStatus, updatedAt: new Date() } });
        if (!data) {
            return {
                error: true,
                message: 'Data not found',
                data: null
            };
        }
        return {
            error: false,
            message: `${data.name} active status has been set to ${activeStatus}`,
            data: null
        };
    }
    catch (err) {
        winston_logger_1.default.error(`Error in updateDistrictActiveStatusHelper helper: ${err}`);
        return {
            error: true,
            message: err.message || "Error in updateDistrictActiveStatusHelper helper",
        };
    }
};
const updateDistrictMonthlyLimitHelper = async (id, limitAmount) => {
    try {
        winston_logger_1.default.info(`updateDistrictMonthlyLimitHelper helper function hit: ${JSON.stringify({ id, limitAmount })}`);
        const data = await districtPaymentLimit_model_1.DistrictPaymentLimitModel.findOneAndUpdate({ _id: id }, { $set: { limitAmount } });
        console.log("data", data);
        if (!data) {
            return {
                error: true,
                message: 'Data not found',
                data: null
            };
        }
        return {
            error: false,
            message: `${data.name} monthly limit has been set to ${limitAmount}`,
            data: null
        };
    }
    catch (err) {
        winston_logger_1.default.error(`Error in updateDistrictMonthlyLimitHelper helper: ${err}`);
        return {
            error: true,
            message: err.message || "Error in updateDistrictMonthlyLimitHelper helper",
        };
    }
};
const createNewDistrictHelper = async (name, limitAmount, activeStatus) => {
    try {
        winston_logger_1.default.info(`createNewDistrictHelper helper function hit: ${JSON.stringify({ name, limitAmount, activeStatus })}`);
        const data = await districtPaymentLimit_model_1.DistrictPaymentLimitModel.create({ name, limitAmount, active: activeStatus });
        return {
            error: false,
            message: 'District created successfully',
            data: data
        };
    }
    catch (err) {
        winston_logger_1.default.error(`Error in createNewDistrictHelper helper: ${err}`);
        return {
            error: true,
            message: err.message || "Error in createNewDistrictHelper helper",
        };
    }
};
exports.districtHelper = {
    getDistrictListHelper,
    updateDistrictActiveStatusHelper,
    updateDistrictMonthlyLimitHelper,
    createNewDistrictHelper
};
//# sourceMappingURL=district.helper.js.map