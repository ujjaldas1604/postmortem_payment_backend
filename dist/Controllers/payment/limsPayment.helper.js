"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentHelper = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../../config/config");
const winston_logger_1 = __importDefault(require("../../config/winston_logger"));
const payments_model_1 = require("../../Models/payments.model");
const CONST_1 = require("../../utils/CONST");
const encrypt_utils_1 = require("../../utils/encrypt.utils");
const decrypt_utils_1 = require("../../utils/decrypt.utils");
const apiUser_model_1 = require("../../Models/apiUser.model");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const districtPaymentLimit_model_1 = require("../../Models/districtPaymentLimit.model");
const getGraphDataHelper = async (startDate, endDate, type) => {
    try {
        winston_logger_1.default.info(`getGraphDataHelper function hit: ${JSON.stringify({
            startDate,
            endDate,
            type,
        })}`);
        const analysisType = type || 'status';
        const validTypes = [
            'district',
            'status',
            'paymentMethod',
            'amount',
        ];
        if (!validTypes.includes(analysisType)) {
            throw new Error(`Invalid type parameter. Must be one of: ${validTypes.join(', ')}`);
        }
        const matchStage = {};
        if (startDate && endDate) {
            matchStage.created_at = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        const pipeline = [
            { $match: matchStage },
            {
                $addFields: {
                    date: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$created_at',
                        },
                    },
                },
            },
        ];
        if (analysisType === 'amount') {
            pipeline.push({
                $group: {
                    _id: '$date',
                    amount: { $sum: '$amount' },
                },
            }, {
                $project: {
                    date: '$_id',
                    amount: 1,
                    _id: 0,
                },
            }, { $sort: { date: 1 } });
        }
        else {
            let fieldToAnalyze;
            switch (analysisType) {
                case 'district':
                    fieldToAnalyze = '$payingFrom.name';
                    break;
                case 'status':
                    fieldToAnalyze = { $arrayElemAt: ['$status.status', -1] };
                    break;
                case 'paymentMethod':
                    fieldToAnalyze = '$paymentMethod';
                    break;
            }
            pipeline.push({
                $addFields: {
                    analysisField: fieldToAnalyze,
                },
            }, {
                $group: {
                    _id: {
                        date: '$date',
                        fieldValue: '$analysisField',
                    },
                    count: { $sum: 1 },
                },
            }, {
                $group: {
                    _id: '$_id.date',
                    fieldCounts: {
                        $push: {
                            fieldValue: '$_id.fieldValue',
                            count: '$count',
                        },
                    },
                },
            }, {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [
                            { date: '$_id' },
                            {
                                $arrayToObject: {
                                    $map: {
                                        input: '$fieldCounts',
                                        as: 'fc',
                                        in: {
                                            k: '$$fc.fieldValue',
                                            v: '$$fc.count',
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            }, { $sort: { date: 1 } });
        }
        const results = await payments_model_1.PaymentModel.aggregate(pipeline).exec();
        return results;
    }
    catch (error) {
        console.error('Error in getGraphDataHelper:', error);
        throw Error(`Error in getGraphDataHelper: ${error.message}`);
    }
};
const baseURL = config_1.config.SBI_BASE_URL;
const makeBulkPayment = async (token, paymentRequest, payloadRefNo) => {
    try {
        winston_logger_1.default.info(`makeBulkPayment utils function hit: ${JSON.stringify({
            token,
            paymentRequest,
        })}`);
        if (!token)
            throw new Error('Authentication token is required');
        if (!paymentRequest?.CustomerId || !paymentRequest?.PayloadRefId) {
            throw new Error('Missing required transaction details');
        }
        winston_logger_1.default.info('generating hash value');
        const sessionKey = encrypt_utils_1.sbiEncryption.generateSessionKey(8);
        const HashValue = encrypt_utils_1.sbiEncryption.generateSign(JSON.stringify(paymentRequest.PaymentDetails));
        const encryptedPaymentData = encrypt_utils_1.sbiEncryption.EncryptAES({
            ...paymentRequest,
            HashValue,
        }, sessionKey);
        const testingDecrypting = await decrypt_utils_1.sbiDecryption.DecryptAES(encryptedPaymentData, sessionKey);
        console.log('testingDecrypting', testingDecrypting);
        const encryptedSessionKey = encrypt_utils_1.sbiEncryption.EncryptRSA(sessionKey);
        const response = await axios_1.default.post(`${baseURL}${CONST_1.CONST.routes.bulkPayment.makePayment}`, {
            CustomerId: paymentRequest.CustomerId,
            PayloadRefId: payloadRefNo,
            PaymentRequest: encryptedPaymentData,
            SessionKey: encryptedSessionKey,
        }, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response?.data) {
            throw new Error('Empty response from payment service');
        }
        console.log('makePayment response', response.data, response.status);
        if (!response.data?.PaymentAck) {
            throw new Error('Invalid makePayment response structure, no PaymentAck');
        }
        const decryptedResponse = await decrypt_utils_1.sbiDecryption.DecryptRSA(response?.data?.PaymentAck);
        winston_logger_1.default.info(`Success in makePayment utils function: ${decryptedResponse}`);
        return JSON.parse(decryptedResponse);
    }
    catch (err) {
        console.log(`api response data: ${err?.response?.data}`);
        winston_logger_1.default.error(`Error in makeBulkPayment utils function: ${err?.message}`);
        winston_logger_1.default.error(`Error in makePayment utils function: ${JSON.stringify({ err })}`);
        return {
            error: true,
            message: err?.response?.data || 'error in making payment',
        };
    }
};
const bulkPaymentStatus = async (token, customerId, payloadRefNo) => {
    try {
        winston_logger_1.default.info(`bulkPaymentStatus utils function hit: ${JSON.stringify({
            token,
            customerId,
            payloadRefNo,
        })}`);
        if (!token)
            throw new Error('Authentication token is required');
        const encryptedPayload = encrypt_utils_1.sbiEncryption.EncryptRSA(JSON.stringify({
            CustomerId: customerId,
            PayloadRefId: payloadRefNo,
        }));
        const response = await axios_1.default.post(`${baseURL}${CONST_1.CONST.routes.bulkPayment.paymentStatus}`, {
            MISRequest: encryptedPayload,
        }, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response?.data) {
            throw new Error('Empty response from payment service');
        }
        console.log('makePayment response', response.data, response.status);
        if (!response.data?.SessionKey) {
            throw new Error(`Invalid bulkPaymentStatus response structure, no SessionKey: ${response?.data?.MISResponse}`);
        }
        const decryptedSessionKey = await decrypt_utils_1.sbiDecryption.DecryptRSA(response?.data?.SessionKey);
        const decryptedResponse = decrypt_utils_1.sbiDecryption.DecryptAES(response?.data?.MISResponse, decryptedSessionKey);
        winston_logger_1.default.info(`Success in bulkPaymentStatus utils function:`, {
            decryptedResponse,
        });
        return JSON.parse(decryptedResponse);
    }
    catch (err) {
        winston_logger_1.default.error(`Error in bulkPaymentStatus utils function: ${err?.message}`);
        return {
            error: true,
            message: err?.response?.data || 'error in checking payment status',
            statusCode: err?.response?.status || null,
        };
    }
};
const checkPaymentLimitStatus = async (_id, currentAmount) => {
    try {
        winston_logger_1.default.info(`checkPaymentLimitStatus utils function hit: ${JSON.stringify({
            _id,
            currentAmount,
        })}`);
        const user = await apiUser_model_1.ApiUserModel.findOne({ _id });
        if (!user) {
            return {
                error: true,
                message: 'User not found',
            };
        }
        const data = await payments_model_1.PaymentModel.aggregate([
            {
                $match: {
                    requestBy: _id,
                },
            },
            {
                $addFields: {
                    lastStatus: { $arrayElemAt: ['$status', -1] },
                    cutoffDate: {
                        $cond: [
                            { $eq: [user.limitTimeRange, 'weekly'] },
                            {
                                $dateFromParts: {
                                    isoWeekYear: { $year: new Date() },
                                    isoWeek: { $week: new Date() },
                                    isoDayOfWeek: 1,
                                },
                            },
                            new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                        ],
                    },
                },
            },
            {
                $match: {
                    'lastStatus.status': 'Success',
                    $expr: {
                        $gte: ['$created_at', '$cutoffDate'],
                    },
                },
            },
        ]);
        const totalAmount = data.reduce((acc, user) => acc + user.amount, 0);
        if (parseInt(totalAmount) + currentAmount > user.limitAmount) {
            return {
                error: true,
                message: `Payment limit exceeded for ${user.name}, limit: ${user.limitAmount}, current: ${totalAmount + currentAmount}`,
            };
        }
        return {
            error: false,
            message: `${user.limitTimeRange} Payment limit not exceeded for ${user.name}, limit: ${user.limitAmount}, current: ${totalAmount}`,
        };
    }
    catch (err) {
        console.log(err?.response);
        console.log(`api response data: ${err?.response?.data}`);
        winston_logger_1.default.error(`Error in checkPaymentLimitStatus utils function: ${err?.message}`);
        winston_logger_1.default.error(`Error in checkPaymentLimitStatus utils function: ${JSON.stringify({
            err,
        })}`);
        throw err;
    }
};
const encryptPaymentResponse = (data) => {
    try {
        winston_logger_1.default.info(`payloadEncrypt utils function hit: ${JSON.stringify({ data })}`);
        let mode = 'stage';
        if (config_1.config.NODE_ENV == 'prod') {
            mode = 'prod';
        }
        const keyPath = path_1.default.join(__dirname, '..', '..', 'keys', mode, 'lims_response_public_key.pem');
        const publicKeyPem = (0, fs_1.readFileSync)(keyPath, 'utf8');
        const encryptedData = crypto_1.default
            .publicEncrypt(publicKeyPem, Buffer.from(JSON.stringify(data), 'utf8'))
            .toString('base64');
        return {
            payload: encryptedData,
        };
    }
    catch (err) {
        winston_logger_1.default.error(`Error in encryptPaymentResponse utils function: ${err?.message}`);
        winston_logger_1.default.error(`Error in encryptPaymentResponse utils function: ${JSON.stringify({
            err,
        })}`);
        throw err;
    }
};
const checkOneUPIaDayLimitStatus = async (upiId) => {
    try {
        winston_logger_1.default.info(`checkOneUPIaDayLimitStatus utils function hit: ${JSON.stringify({
            upiId,
        })}`);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const user = await payments_model_1.PaymentModel.findOne({
            'payingTo.upi': upiId,
            created_at: { $gte: todayStart },
            $expr: {
                $ne: [
                    { $arrayElemAt: ['$status.status', -1] },
                    'Failure',
                ],
            },
        });
        winston_logger_1.default.warn('user', user);
        if (user) {
            winston_logger_1.default.info(`Upi transaction already exists on the given upi id today`);
            return {
                error: true,
                message: `Upi transaction already exists on the given upi id today`,
            };
        }
        winston_logger_1.default.info(`Upi transaction does not exist on the given upi id today`);
        return {
            error: false,
            message: `Upi transaction does not exist on the given upi id today`,
        };
    }
    catch (err) {
        winston_logger_1.default.error(`Error in checkOneUPIaDayLimitStatus utils function: ${err?.message}`);
        winston_logger_1.default.error(`Error in checkOneUPIaDayLimitStatus utils function: ${JSON.stringify({
            err,
        })}`);
        throw err;
    }
};
const paymentReportExcelHelper = async (startDate, endDate) => {
    try {
        winston_logger_1.default.info(`paymentReportExcelHelper function hit: ${JSON.stringify({
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
                    paymentMethod: 1,
                    payingToName: '$payingTo.name',
                    payingToDesignation: '$payingTo.designation',
                    lastStatus: { $arrayElemAt: ['$status', -1] },
                },
            },
        ]);
        const listResult = results.map((result) => {
            return [
                result.payloadRefId,
                result.informationId,
                result.payingFrom.trim(),
                result.payingToName,
                result.amount,
                result.lastStatus.status,
                result.lastStatus.date.toLocaleString(),
            ];
        });
        return {
            error: false,
            data: [
                [
                    'Payment Id',
                    'Info Id',
                    'Paying From',
                    'Paying To',
                    'Amount',
                    'Status',
                    'resolved',
                ],
                ...listResult,
            ],
        };
    }
    catch (err) {
        winston_logger_1.default.error(`Error in paymentReportExcelHelper utils function: ${err?.message}`);
        return {
            error: true,
            message: `Error in paymentReportExcelHelper utils function: ${err?.message}`,
        };
    }
};
const groupedPaymentReportExcelHelper = async (startDate, endDate) => {
    try {
        winston_logger_1.default.info(`groupedPaymentReportExcelHelper function hit: ${JSON.stringify({
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
                },
            },
            {
                $project: {
                    _id: 0,
                    payingFromName: 1,
                    totalAmount: 1,
                    totalAmountSuccess: 1,
                    totalAmountFailed: 1,
                },
            },
        ]);
        console.log(results);
        const listResult = results.map((result) => {
            return [
                result.payingFromName,
                result.totalAmount,
                result.totalAmountSuccess,
                result.totalAmountFailed,
            ];
        });
        return {
            error: false,
            data: [
                [
                    'Paying From',
                    'Total Amount',
                    'Total Amount Success',
                    'Total Amount Failed',
                ],
                ...listResult,
            ],
        };
    }
    catch (err) {
        winston_logger_1.default.error(`Error in groupedPaymentReportExcelHelper utils function: ${err?.message}`);
        return {
            error: true,
            message: `Error in groupedPaymentReportExcelHelper utils function: ${err?.message}`,
        };
    }
};
const checkDistrictWiseLimitStatus = async (dist, currentAmount) => {
    try {
        winston_logger_1.default.info(`checkPaymentLimitStatus utils function hit: ${JSON.stringify({
            dist,
            currentAmount,
        })}`);
        const validDistList = await districtPaymentLimit_model_1.DistrictPaymentLimitModel.findOne({ name: dist });
        if (!validDistList) {
            return {
                error: true,
                message: `${dist} is not allowed to make payment, please select a authorized district`,
            };
        }
        const data = await payments_model_1.PaymentModel.aggregate([
            {
                $addFields: {
                    lastStatus: { $arrayElemAt: ['$status', -1] },
                    cutoffDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                },
            },
            {
                $match: {
                    'payingFrom.name': dist,
                    'lastStatus.status': { $in: ['Success', 'Pending'] },
                    $expr: {
                        $gte: ['$created_at', '$cutoffDate'],
                    },
                },
            },
        ]);
        const totalAmount = data.reduce((acc, user) => acc + user.amount, 0);
        if (parseInt(totalAmount) + currentAmount > validDistList.limitAmount) {
            return {
                error: true,
                message: `Payment limit exceeded for ${dist}, limit: ${validDistList.limitAmount}, current: ${totalAmount}, payment amount: ${currentAmount}`,
            };
        }
        return {
            error: false,
            message: `Monthly Payment limit not exceeded for ${dist}, limit: ${validDistList.limitAmount}, current: ${totalAmount}, payment amount: ${currentAmount}`,
        };
    }
    catch (err) {
        winston_logger_1.default.error(`Error in checkDistrictWiseLimitStatus utils function: ${err?.message}`);
        winston_logger_1.default.error(`Error in checkDistrictWiseLimitStatus utils function: ${JSON.stringify({
            err,
        })}`);
        return {
            error: true,
            message: `Error in checkDistrictWiseLimitStatus utils function: ${err?.message}`,
        };
    }
};
exports.paymentHelper = {
    makeBulkPayment,
    getGraphDataHelper,
    bulkPaymentStatus,
    checkPaymentLimitStatus,
    encryptPaymentResponse,
    checkOneUPIaDayLimitStatus,
    paymentReportExcelHelper,
    groupedPaymentReportExcelHelper,
    checkDistrictWiseLimitStatus,
};
//# sourceMappingURL=limsPayment.helper.js.map