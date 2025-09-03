import axios from 'axios';
import { config } from '../../config/config';
import logger from '../../config/winston_logger';
import { PaymentModel } from '../../Models/payments.model';
import { CONST } from '../../utils/CONST';
import { sbiEncryption } from '../../utils/encrypt.utils';
import { sbiDecryption } from '../../utils/decrypt.utils';
import { ApiUserModel } from '../../Models/apiUser.model';
import { readFileSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DistrictPaymentLimitModel } from '../../Models/districtPaymentLimit.model';
// import mongoose from 'mongoose';

const getGraphDataHelper = async (
    startDate?: string,
    endDate?: string,
    type?: 'district' | 'status' | 'paymentMethod' | 'amount'
) => {
    try {
        logger.info(
            `getGraphDataHelper function hit: ${JSON.stringify({
                startDate,
                endDate,
                type,
            })}`
        );

        // Set default type if not provided
        const analysisType = type || 'status';

        // Validate type parameter
        const validTypes = [
            'district',
            'status',
            'paymentMethod',
            'amount',
        ] as const;
        if (!validTypes.includes(analysisType)) {
            throw new Error(
                `Invalid type parameter. Must be one of: ${validTypes.join(
                    ', '
                )}`
            );
        }

        // Base match stage
        const matchStage: any = {};

        if (startDate && endDate) {
            matchStage.created_at = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        // Aggregation pipeline
        const pipeline: any[] = [
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
            // Special handling for amount type - sum amounts by date
            pipeline.push(
                {
                    $group: {
                        _id: '$date',
                        amount: { $sum: '$amount' },
                    },
                },
                {
                    $project: {
                        date: '$_id',
                        amount: 1,
                        _id: 0,
                    },
                },
                { $sort: { date: 1 } }
            );
        } else {
            // Original logic for other types
            let fieldToAnalyze: any;
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

            pipeline.push(
                {
                    $addFields: {
                        analysisField: fieldToAnalyze,
                    },
                },
                {
                    $group: {
                        _id: {
                            date: '$date',
                            fieldValue: '$analysisField',
                        },
                        count: { $sum: 1 },
                    },
                },
                {
                    $group: {
                        _id: '$_id.date',
                        fieldCounts: {
                            $push: {
                                fieldValue: '$_id.fieldValue',
                                count: '$count',
                            },
                        },
                    },
                },
                {
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
                },
                { $sort: { date: 1 } }
            );
        }

        const results = await PaymentModel.aggregate(pipeline).exec();

        return results;
    } catch (error: any) {
        console.error('Error in getGraphDataHelper:', error);
        throw Error(`Error in getGraphDataHelper: ${error.message}`);
    }
};

const baseURL = config.SBI_BASE_URL;

const makeBulkPayment = async (
    token: string,
    paymentRequest: any,
    payloadRefNo: string
) => {
    try {
        logger.info(
            `makeBulkPayment utils function hit: ${JSON.stringify({
                token,
                paymentRequest,
            })}`
        );
        if (!token) throw new Error('Authentication token is required');
        if (!paymentRequest?.CustomerId || !paymentRequest?.PayloadRefId) {
            throw new Error('Missing required transaction details');
        }

        logger.info('generating hash value');
        const sessionKey = sbiEncryption.generateSessionKey(8);
        const HashValue = sbiEncryption.generateSign(
            JSON.stringify(paymentRequest.PaymentDetails)
        );
        const encryptedPaymentData = sbiEncryption.EncryptAES(
            {
                ...paymentRequest,
                HashValue,
            },
            sessionKey
        );
        const testingDecrypting = await sbiDecryption.DecryptAES(
            encryptedPaymentData,
            sessionKey
        );
        console.log('testingDecrypting', testingDecrypting);
        const encryptedSessionKey = sbiEncryption.EncryptRSA(sessionKey);

        const response = await axios.post(
            `${baseURL}${CONST.routes.bulkPayment.makePayment}`,
            {
                CustomerId: paymentRequest.CustomerId,
                PayloadRefId: payloadRefNo,
                PaymentRequest: encryptedPaymentData,
                SessionKey: encryptedSessionKey,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        if (!response?.data) {
            throw new Error('Empty response from payment service');
        }
        console.log('makePayment response', response.data, response.status);

        if (!response.data?.PaymentAck) {
            throw new Error(
                'Invalid makePayment response structure, no PaymentAck'
            );
        }

        const decryptedResponse = await sbiDecryption.DecryptRSA(
            response?.data?.PaymentAck
        );

        logger.info(
            `Success in makePayment utils function: ${decryptedResponse}`
        );
        return JSON.parse(decryptedResponse);
    } catch (err: any) {
        console.log(`api response data: ${err?.response?.data}`);
        logger.error(
            `Error in makeBulkPayment utils function: ${err?.message}`
        );
        logger.error(
            `Error in makePayment utils function: ${JSON.stringify({ err })}`
        );
        return {
            error: true,
            message: err?.response?.data || 'error in making payment',
        };
    }
};

const bulkPaymentStatus = async (
    token: string,
    customerId: string,
    payloadRefNo: string
) => {
    try {
        logger.info(
            `bulkPaymentStatus utils function hit: ${JSON.stringify({
                token,
                customerId,
                payloadRefNo,
            })}`
        );
        if (!token) throw new Error('Authentication token is required');
        const encryptedPayload = sbiEncryption.EncryptRSA(
            JSON.stringify({
                CustomerId: customerId,
                PayloadRefId: payloadRefNo,
            })
        );

        const response = await axios.post(
            `${baseURL}${CONST.routes.bulkPayment.paymentStatus}`,
            {
                MISRequest: encryptedPayload,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response?.data) {
            throw new Error('Empty response from payment service');
        }
        console.log('makePayment response', response.data, response.status);

        if (!response.data?.SessionKey) {
            throw new Error(
                `Invalid bulkPaymentStatus response structure, no SessionKey: ${response?.data?.MISResponse}`
            );
        }

        const decryptedSessionKey = await sbiDecryption.DecryptRSA(
            response?.data?.SessionKey
        );
        const decryptedResponse = sbiDecryption.DecryptAES(
            response?.data?.MISResponse,
            decryptedSessionKey
        );

        logger.info(`Success in bulkPaymentStatus utils function:`, {
            decryptedResponse,
        });
        return JSON.parse(decryptedResponse);
    } catch (err: any) {
        logger.error(
            `Error in bulkPaymentStatus utils function: ${err?.message}`
        );
        return {
            error: true,
            message: err?.response?.data || 'error in checking payment status',
            statusCode: err?.response?.status || null,
        };
    }
};

const checkPaymentLimitStatus = async (_id: string, currentAmount: number) => {
    try {
        logger.info(
            `checkPaymentLimitStatus utils function hit: ${JSON.stringify({
                _id,
                currentAmount,
            })}`
        );

        const user = await ApiUserModel.findOne({ _id });
        if (!user) {
            return {
                error: true,
                message: 'User not found',
            };
        }

        const data = await PaymentModel.aggregate([
            {
                $match: {
                    requestBy: _id,
                },
            },
            {
                $addFields: {
                    lastStatus: { $arrayElemAt: ['$status', -1] },
                    // Determine the cutoff date based on user's limitTimeRange
                    cutoffDate: {
                        $cond: [
                            { $eq: [user.limitTimeRange, 'weekly'] },
                            {
                                $dateFromParts: {
                                    isoWeekYear: { $year: new Date() },
                                    isoWeek: { $week: new Date() },
                                    isoDayOfWeek: 1, // Monday
                                },
                            },
                            new Date(
                                new Date().getFullYear(),
                                new Date().getMonth(),
                                1
                            ),
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
                message: `Payment limit exceeded for ${user.name}, limit: ${
                    user.limitAmount
                }, current: ${totalAmount + currentAmount}`,
            };
        }

        return {
            error: false,
            message: `${user.limitTimeRange} Payment limit not exceeded for ${user.name}, limit: ${user.limitAmount}, current: ${totalAmount}`,
        };
    } catch (err: any) {
        console.log(err?.response);
        console.log(`api response data: ${err?.response?.data}`);
        logger.error(
            `Error in checkPaymentLimitStatus utils function: ${err?.message}`
        );
        logger.error(
            `Error in checkPaymentLimitStatus utils function: ${JSON.stringify({
                err,
            })}`
        );
        throw err;
    }
};

const encryptPaymentResponse = (data: object) => {
    try {
        logger.info(
            `payloadEncrypt utils function hit: ${JSON.stringify({ data })}`
        );
        let mode = 'stage';
        if (config.NODE_ENV == 'prod') {
            mode = 'prod';
        }
        const keyPath = path.join(
            __dirname,
            '..',
            '..',
            'keys',
            mode,
            'lims_response_public_key.pem'
        );
        const publicKeyPem = readFileSync(keyPath, 'utf8');
        const encryptedData = crypto
            .publicEncrypt(
                publicKeyPem,
                Buffer.from(JSON.stringify(data), 'utf8')
            )
            .toString('base64');
        return {
            payload: encryptedData,
        };
    } catch (err: any) {
        logger.error(
            `Error in encryptPaymentResponse utils function: ${err?.message}`
        );
        logger.error(
            `Error in encryptPaymentResponse utils function: ${JSON.stringify({
                err,
            })}`
        );
        throw err;
    }
};

const checkOneUPIaDayLimitStatus = async (upiId: string) => {
    try {
        logger.info(
            `checkOneUPIaDayLimitStatus utils function hit: ${JSON.stringify({
                upiId,
            })}`
        );

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const user = await PaymentModel.findOne({
            'payingTo.upi': upiId,
            created_at: { $gte: todayStart },
            $expr: {
                $ne: [
                    { $arrayElemAt: ['$status.status', -1] }, // Get last status
                    'Failure',
                ],
            },
        });

        logger.warn('user', user);

        if (user) {
            logger.info(
                `Upi transaction already exists on the given upi id today`
            );
            return {
                error: true,
                message: `Upi transaction already exists on the given upi id today`,
            };
        }

        logger.info(`Upi transaction does not exist on the given upi id today`);
        return {
            error: false,
            message: `Upi transaction does not exist on the given upi id today`,
        };
    } catch (err: any) {
        logger.error(
            `Error in checkOneUPIaDayLimitStatus utils function: ${err?.message}`
        );
        logger.error(
            `Error in checkOneUPIaDayLimitStatus utils function: ${JSON.stringify(
                {
                    err,
                }
            )}`
        );
        throw err;
    }
};

const paymentReportExcelHelper = async (
    startDate?: string,
    endDate?: string
) => {
    try {
        logger.info(
            `paymentReportExcelHelper function hit: ${JSON.stringify({
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
                    paymentMethod: 1,
                    payingToName: '$payingTo.name',
                    payingToDesignation: '$payingTo.designation',
                    //   firstStatus: { $arrayElemAt: ["$status", 0] },
                    lastStatus: { $arrayElemAt: ['$status', -1] },
                },
            },
        ]);

        const listResult = results.map((result: any) => {
            return [
                result.payloadRefId,
                result.informationId,
                result.payingFrom.trim(),
                result.payingToName,
                result.amount,
                result.lastStatus.status,
                // result.firstStatus.date,
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
    } catch (err: any) {
        logger.error(
            `Error in paymentReportExcelHelper utils function: ${err?.message}`
        );
        return {
            error: true,
            message: `Error in paymentReportExcelHelper utils function: ${err?.message}`,
        };
    }
};

const groupedPaymentReportExcelHelper = async (
    startDate?: string,
    endDate?: string
) => {
    try {
        logger.info(
            `groupedPaymentReportExcelHelper function hit: ${JSON.stringify({
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

        const listResult = results.map((result: any) => {
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
    } catch (err: any) {
        logger.error(
            `Error in groupedPaymentReportExcelHelper utils function: ${err?.message}`
        );
        return {
            error: true,
            message: `Error in groupedPaymentReportExcelHelper utils function: ${err?.message}`,
        };
    }
};

const checkDistrictWiseLimitStatus = async (
    dist: string,
    currentAmount: number
) => {
    try {
        logger.info(
            `checkPaymentLimitStatus utils function hit: ${JSON.stringify({
                dist,
                currentAmount,
            })}`
        );

        const validDistList = await DistrictPaymentLimitModel.findOne({
            name: dist,
        });

        if (!validDistList) {
            return {
                error: true,
                message: `${dist} is not allowed to make payment, please select a authorized district`,
            };
        }

        const data = await PaymentModel.aggregate([
            {
                $addFields: {
                    lastStatus: { $arrayElemAt: ['$status', -1] },
                    // Determine the cutoff date based on user's limitTimeRange
                    cutoffDate: new Date(
                        new Date().getFullYear(),
                        new Date().getMonth(),
                        1
                    ),
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
    } catch (err: any) {
        logger.error(
            `Error in checkDistrictWiseLimitStatus utils function: ${err?.message}`
        );
        logger.error(
            `Error in checkDistrictWiseLimitStatus utils function: ${JSON.stringify(
                {
                    err,
                }
            )}`
        );
        return {
            error: true,
            message: `Error in checkDistrictWiseLimitStatus utils function: ${err?.message}`,
        };
    }
};
const checkDesignation = async (dsesignation: string, PostmortemID: string) => {
    try {
        logger.info(
            `check Designation: ${JSON.stringify({
                dsesignation,
                PostmortemID,
            })}`
        );

        const data = await PaymentModel.aggregate([
            {
                $match: {
                    PostmortemID: PostmortemID,
                    'payingTo.designation': dsesignation, // fixed spelling + quotes
                },
            },
            {
                $addFields: {
                    lastStatus: { $arrayElemAt: ['$status', -1] }, // properly closed
                },
            },
            {
                $match: {
                    'lastStatus.status': 'Success',
                },
            },
        ]);

        const exists = data.length > 0;
        if(exists){
            return {
            error: true,
            message: `This peopel already got the reward`,
        };
        }
        else{
             return {
            error: false,
            message: `checked not given the reward`,
        };
        }
       
    } catch (err: any) {
        console.log(err?.response);
        console.log(`api response data: ${err?.response?.data}`);
        logger.error(
            `Error in checkPaymentLimitStatus utils function: ${err?.message}`
        );
        logger.error(
            `Error in checkPaymentLimitStatus utils function: ${JSON.stringify({
                err,
            })}`
        );
        throw err;
    }
};
export const paymentHelper = {
    makeBulkPayment,
    getGraphDataHelper,
    bulkPaymentStatus,
    checkPaymentLimitStatus,
    encryptPaymentResponse,
    checkOneUPIaDayLimitStatus,
    paymentReportExcelHelper,
    groupedPaymentReportExcelHelper,
    checkDistrictWiseLimitStatus,
    checkDesignation,

    // decryptSbiResponse
};
