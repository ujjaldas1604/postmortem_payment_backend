"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentController = void 0;
const config_1 = require("../../config/config");
const winston_logger_1 = __importDefault(require("../../config/winston_logger"));
const getToken_utils_1 = __importDefault(require("../../utils/getToken.utils"));
const payments_model_1 = require("../../Models/payments.model");
const generate_utils_1 = require("../../utils/generate.utils");
const limsPayment_helper_1 = require("./limsPayment.helper");
const runInIntreval_utils_1 = require("../../utils/runInIntreval.utils");
const axios_1 = __importDefault(require("axios"));
const upiPaymentController = async (req, res) => {
    try {
        winston_logger_1.default.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body,
            contentType: req.headers['content-type'],
        });
        if (config_1.config.PAYMENT_WHITELIST_MODE === 'true') {
            winston_logger_1.default.info('Whitelist mode is enabled');
            const reqIp = req.headers['x-forwarded-for']
                .split(',')[0]
                .trim();
            winston_logger_1.default.info(`requested ip: ${reqIp || req.ip}`);
            if (!req.ip ||
                !['::1', '127.0.0.1', config_1.config.WHITELISTED_IP_1].includes(reqIp || req.ip)) {
                winston_logger_1.default.error('Your ip is not whitelisted');
                res.status(401).json(limsPayment_helper_1.paymentHelper.encryptPaymentResponse({
                    error: true,
                    message: 'Your ip is not whitelisted',
                }));
                return;
            }
        }
        const { rewardedBy, rewardedTo, amount, districtId, phoneNo, email, remarks, informationId, paymentMethod, } = req.body;
        const paymentRefNo = Math.floor(Math.random() * 1000000000000000)
            .toString()
            .padStart(10, '0')
            .slice(0, 10);
        const payloadRefId = 'CMP' +
            Math.floor(Math.random() * 1000000000000000)
                .toString()
                .padStart(10, '0')
                .slice(0, 10);
        winston_logger_1.default.info(`Starting db insertion in upiPaymentController`);
        if (!req.apiUser) {
            winston_logger_1.default.error(`Authorization Failed in upiPaymentController`);
            res.status(400).json(limsPayment_helper_1.paymentHelper.encryptPaymentResponse({
                error: true,
                message: 'Authorization Failed',
            }));
            return;
        }
        const limit = await limsPayment_helper_1.paymentHelper.checkPaymentLimitStatus(req.apiUser?.id, parseInt(amount));
        if (limit.error) {
            winston_logger_1.default.error(`Error in upiPaymentController: ${limit.message}`);
            res.status(400).json(limsPayment_helper_1.paymentHelper.encryptPaymentResponse({
                error: true,
                message: limit.message,
            }));
            return;
        }
        else {
            winston_logger_1.default.info(limit.message);
        }
        const limit2 = await limsPayment_helper_1.paymentHelper.checkOneUPIaDayLimitStatus(rewardedTo.upi);
        if (limit2.error) {
            winston_logger_1.default.error(`Error in upiPaymentController: ${limit2.message}`);
            res.status(400).json(limsPayment_helper_1.paymentHelper.encryptPaymentResponse({
                error: true,
                message: limit2.message,
            }));
            return;
        }
        else {
            winston_logger_1.default.info(limit2.message);
        }
        const limit3 = await limsPayment_helper_1.paymentHelper.checkDistrictWiseLimitStatus(rewardedBy.name.trim(), parseInt(amount));
        if (limit3.error) {
            winston_logger_1.default.error(`Error in upiPaymentController: ${limit3.message}`);
            res.status(400).json(limsPayment_helper_1.paymentHelper.encryptPaymentResponse({
                error: true,
                message: limit3.message,
            }));
            return;
        }
        else {
            winston_logger_1.default.info(limit3.message);
        }
        await payments_model_1.PaymentModel.create({
            id: generate_utils_1.generateUtils.generateID('PAY'),
            requestBy: req.apiUser.id,
            payingFrom: {
                ...(rewardedBy.wbpId && {
                    wbpId: rewardedBy.wbpId.trim(),
                }),
                name: rewardedBy.name.trim(),
                ...(rewardedBy.designation && {
                    designation: rewardedBy.designation,
                }),
            },
            payingTo: {
                wbpId: rewardedTo.wbpId,
                name: rewardedTo.name,
                ...(rewardedTo.designation && {
                    designation: rewardedTo.designation,
                }),
                ...(rewardedTo.accountNo && {
                    accountNo: rewardedTo.accountNo,
                }),
                upi: rewardedTo.upi,
                ...(rewardedTo.ifsc && { ifsc: rewardedTo.ifsc }),
            },
            amount: amount,
            paymentMethod: paymentMethod || config_1.config.PAYMENT_MODE,
            email: email,
            phoneNo: phoneNo,
            status: [
                {
                    status: 'Initiated',
                    date: new Date(),
                    remarks: 'Payment has been initiated',
                },
            ],
            payloadRefId: payloadRefId,
            paymentRefNo: paymentRefNo,
            informationId: informationId,
            ...(config_1.config.NODE_ENV !== 'prod' && { staging: true }),
            remarks: remarks,
            ...(districtId && { districtId }),
        });
        winston_logger_1.default.info('Payment inserted successfully:');
        let token = await (0, getToken_utils_1.default)(config_1.config.CUSTOMER_ID || '');
        if (token.error) {
            await payments_model_1.PaymentModel.updateOne({ paymentRefNo: paymentRefNo, payloadRefId: payloadRefId }, {
                $push: {
                    status: {
                        status: 'Failed',
                        date: new Date(),
                        remarks: `Payment Cancelled due to Token Generation Failure: ${token.message}`,
                    },
                },
            });
            res.status(400).json(limsPayment_helper_1.paymentHelper.encryptPaymentResponse({
                error: true,
                message: `Payment Cancelled due to Token Generation Failure: ${token.message}`,
            }));
            return;
        }
        winston_logger_1.default.info(`Token Generated, Initiating payment`);
        const paymentRequest = {
            CustomerId: config_1.config.CUSTOMER_ID || '',
            PayloadRefId: payloadRefId,
            PaymentDetails: [
                {
                    DebitAccountNo: config_1.config.DEBIT_ACCOUNT_NO,
                    ProductCode: paymentMethod || config_1.config.PAYMENT_MODE,
                    PaymentReferenceNo: paymentRefNo,
                    Amount: amount,
                    BeneficiaryName: rewardedTo.name,
                    BeneficiaryAccountNo: rewardedTo.accountNo || 'randStr',
                    BeneficiaryIFSC: rewardedTo.ifsc || 'randStr',
                    MobileNo: phoneNo,
                    EmailID: email,
                    Remarks1: remarks,
                    PostingDate: new Date()
                        .toLocaleDateString('en-GB')
                        .replace(/\//g, '-'),
                    AdditionalField1: rewardedTo.upi,
                },
            ],
        };
        const paymentResponse = await limsPayment_helper_1.paymentHelper.makeBulkPayment(token.data?.token, paymentRequest, payloadRefId);
        if (paymentResponse.error) {
            await payments_model_1.PaymentModel.updateOne({ paymentRefNo: paymentRefNo, payloadRefId: payloadRefId }, {
                $push: {
                    status: {
                        status: 'Failure',
                        date: new Date(),
                        remarks: paymentResponse.message || 'Error in payment',
                    },
                },
            });
            winston_logger_1.default.error(`Error in upiPaymentController: ${paymentResponse.message}`);
            res.status(400).json(limsPayment_helper_1.paymentHelper.encryptPaymentResponse({
                error: true,
                message: paymentResponse.message || 'Error in payment',
            }));
            return;
        }
        if (paymentResponse.Status === 'Success') {
            await payments_model_1.PaymentModel.updateOne({ paymentRefNo: paymentRefNo, payloadRefId: payloadRefId }, {
                $push: {
                    status: {
                        status: 'Processing',
                        date: new Date(),
                        remarks: 'Payment Request is being processed',
                    },
                },
                $set: {
                    ...(paymentResponse.JournalNo && {
                        journalNo: paymentResponse.JournalNo,
                    }),
                    ...(paymentResponse.CMPReferenceNo && {
                        CMPReferenceNo: paymentResponse.CMPReferenceNo,
                    }),
                },
            });
        }
        else {
            await payments_model_1.PaymentModel.updateOne({ paymentRefNo: paymentRefNo, payloadRefId: payloadRefId }, {
                $push: {
                    status: {
                        status: 'Failure',
                        date: new Date(),
                        remarks: 'Error in making payment',
                    },
                },
            });
            winston_logger_1.default.error(`Error in upiPaymentController: ${paymentResponse.message}`);
            res.status(400).json(limsPayment_helper_1.paymentHelper.encryptPaymentResponse({
                error: true,
                message: paymentResponse.message || 'Error in payment',
            }));
            return;
        }
        let statusResponse = await limsPayment_helper_1.paymentHelper.bulkPaymentStatus(token.data?.token, config_1.config.CUSTOMER_ID, payloadRefId);
        if (statusResponse.statusCode === 610) {
            winston_logger_1.default.warn('Token expired in upiPaymentController, regenerating token');
            token = await (0, getToken_utils_1.default)(config_1.config.CUSTOMER_ID || '');
            if (token.error) {
                res.status(400).json(limsPayment_helper_1.paymentHelper.encryptPaymentResponse({
                    error: true,
                    message: `Payment status not updated due to Token Generation Failure: ${token.message}`,
                }));
                return;
            }
            statusResponse = await limsPayment_helper_1.paymentHelper.bulkPaymentStatus(token.data?.token, config_1.config.CUSTOMER_ID, payloadRefId);
        }
        if (statusResponse.error) {
            winston_logger_1.default.error(`Error in upiPaymentController: ${statusResponse.message}`);
            res.status(400).json(limsPayment_helper_1.paymentHelper.encryptPaymentResponse({
                error: true,
                message: statusResponse.message || 'Error in payment',
            }));
            return;
        }
        const paymentStatus = await payments_model_1.PaymentModel.findOneAndUpdate({ payloadRefId: statusResponse.PayloadRefId }, {
            $push: {
                status: {
                    status: statusResponse.MISData[0].Status,
                    date: new Date(),
                    remarks: statusResponse.MISData[0].Reason,
                },
            },
            $set: {
                ...(statusResponse.MISData[0].UTR && {
                    UTR: statusResponse.MISData[0].UTR,
                }),
                ...(statusResponse.MISData[0].ProcessedDate && {
                    processedDate: new Date(statusResponse.MISData[0].ProcessedDate),
                }),
            },
        });
        (0, runInIntreval_utils_1.runInInterval)(payloadRefId, async () => {
            try {
                let statusResponse = await limsPayment_helper_1.paymentHelper.bulkPaymentStatus(token.data?.token, config_1.config.CUSTOMER_ID, payloadRefId);
                if (statusResponse.statusCode === 610) {
                    winston_logger_1.default.warn('Token expired in paymentStatus cron run In Interval, regenerating token');
                    token = await (0, getToken_utils_1.default)(config_1.config.CUSTOMER_ID || '');
                    if (token.error) {
                        res.status(400).json(limsPayment_helper_1.paymentHelper.encryptPaymentResponse({
                            error: true,
                            message: `Payment status not updated due to Token Generation Failure: ${token.message}`,
                        }));
                        return {
                            break: false,
                        };
                    }
                    statusResponse = await limsPayment_helper_1.paymentHelper.bulkPaymentStatus(token.data?.token, config_1.config.CUSTOMER_ID, payloadRefId);
                }
                if (statusResponse.error) {
                    winston_logger_1.default.error(`Error in setInterval payment status: ${statusResponse.message}`);
                    return {
                        break: false,
                    };
                }
                const pay = await payments_model_1.PaymentModel.findOne({
                    payloadRefId: statusResponse.PayloadRefId,
                });
                if (!pay) {
                    res.status(400).json({
                        message: 'Payment not found',
                    });
                    return {
                        break: false,
                    };
                }
                if (pay.status[pay.status.length - 1].status ===
                    statusResponse.MISData[0].Status &&
                    pay.status[pay.status.length - 1].remarks ===
                        statusResponse.MISData[0].Reason) {
                    await payments_model_1.PaymentModel.updateOne({ payloadRefId: statusResponse.PayloadRefId }, {
                        $set: {
                            [`status.${pay.status.length - 1}.date`]: new Date(),
                            ...(statusResponse.MISData[0].UTR && {
                                UTR: statusResponse.MISData[0].UTR,
                            }),
                            ...(statusResponse.MISData[0]
                                .ProcessedDate && {
                                processedDate: new Date(statusResponse.MISData[0].ProcessedDate),
                            }),
                            ...(statusResponse.MISData[0].UTR && {
                                UTR: statusResponse.MISData[0].UTR,
                            }),
                        },
                    });
                }
                else {
                    await payments_model_1.PaymentModel.updateOne({ payloadRefId: statusResponse.PayloadRefId }, {
                        $push: {
                            status: {
                                status: statusResponse.MISData[0]
                                    .Status,
                                date: new Date(),
                                remarks: statusResponse.MISData[0].Reason,
                            },
                        },
                        $set: {
                            ...(statusResponse.MISData[0].UTR && {
                                UTR: statusResponse.MISData[0].UTR,
                            }),
                        },
                    });
                }
                if (statusResponse.MISData[0].Status === 'Success' ||
                    statusResponse.MISData[0].Status === 'Failure') {
                    winston_logger_1.default.info('Payment has been resolved');
                    const formData = new FormData();
                    formData.append('transactionId', statusResponse.PayloadRefId);
                    formData.append('transactionStatus', statusResponse.MISData[0].Status);
                    formData.append('infoId', informationId);
                    winston_logger_1.default.info('Initiating payment resolve status update to lims');
                    const limsResponse = await axios_1.default.post(config_1.config.PAYMENT_STATUS_LIMS_ENDPOINT, formData, {
                        headers: {
                            Authorization: `Bearer ${config_1.config.PAYMENT_STATUS_LIMS_TOKEN}`,
                            'Content-Type': 'multipart/form-data',
                        },
                    });
                    winston_logger_1.default.info("payment status update response from LIMS", limsResponse.data);
                    return {
                        break: true,
                    };
                }
                return {
                    break: false,
                };
            }
            catch (err) {
                winston_logger_1.default.error(`Error in setInterval payment status check: ${err.message}`, { err });
                return {
                    break: false,
                };
            }
        }, 120000);
        res.status(200).json(limsPayment_helper_1.paymentHelper.encryptPaymentResponse({
            error: false,
            payloadRefId: statusResponse.PayloadRefId,
            paymentStatus: statusResponse.MISData[0].Status,
            paymentMode: paymentStatus?.paymentMethod,
            Reason: statusResponse.MISData[0].Reason,
            data: statusResponse.MISData,
        }));
        return;
    }
    catch (err) {
        winston_logger_1.default.error(`Error in upiPaymentController: ${err}`);
        res.status(500).json(limsPayment_helper_1.paymentHelper.encryptPaymentResponse({
            error: true,
            message: `Internal Server Error: ${err.message}`,
        }));
    }
};
const paymentStatusController = async (req, res) => {
    try {
        winston_logger_1.default.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body,
            contentType: req.headers['content-type'],
        });
        const { payloadRefId } = req.body;
        if (!payloadRefId) {
            res.status(400).json({
                message: 'Missing required parameters',
            });
            return;
        }
        const token = await (0, getToken_utils_1.default)(config_1.config.CUSTOMER_ID);
        if (token.error) {
            res.status(401).json({
                error: true,
                message: `Payment Cancelled due to Token Generation Failure: ${token.message}`,
            });
            return;
        }
        const statusResponse = await limsPayment_helper_1.paymentHelper.bulkPaymentStatus(token.data?.token, config_1.config.CUSTOMER_ID, payloadRefId);
        const pay = await payments_model_1.PaymentModel.findOne({
            payloadRefId: statusResponse.PayloadRefId,
        });
        if (!pay) {
            res.status(400).json({
                error: true,
                message: 'Payment not found',
            });
            return;
        }
        if (pay.status[pay.status.length - 1].status ===
            statusResponse.MISData[0].Status &&
            pay.status[pay.status.length - 1].remarks ===
                statusResponse.MISData[0].Reason) {
            await payments_model_1.PaymentModel.updateOne({ payloadRefId: statusResponse.PayloadRefId }, {
                $set: {
                    [`status.${pay.status.length - 1}.date`]: new Date(),
                    ...(statusResponse.MISData[0].UTR && {
                        UTR: statusResponse.MISData[0].UTR,
                    }),
                    ...(statusResponse.MISData[0].ProcessedDate && {
                        processedDate: new Date(statusResponse.MISData[0].ProcessedDate),
                    }),
                    ...(statusResponse.MISData[0].UTR && {
                        UTR: statusResponse.MISData[0].UTR,
                    }),
                },
            });
        }
        else {
            await payments_model_1.PaymentModel.updateOne({ payloadRefId: statusResponse.PayloadRefId }, {
                $push: {
                    status: {
                        status: statusResponse.MISData[0].Status,
                        date: new Date(),
                        remarks: statusResponse.MISData[0].Reason,
                    },
                },
                $set: {
                    ...(statusResponse.MISData[0].UTR && {
                        UTR: statusResponse.MISData[0].UTR,
                    }),
                },
            });
        }
        res.status(200).json({
            error: false,
            payloadRefId: statusResponse.PayloadRefId,
            paymentStatus: statusResponse.MISData[0].Status,
            paymentMode: pay.paymentMethod,
            Reason: statusResponse.MISData[0].Reason,
            data: statusResponse.MISData,
        });
        return;
    }
    catch (error) {
        winston_logger_1.default.error(`Error in paymentStatusController: ${error}`);
        res.status(500).json({
            error: true,
            message: error.message || 'Internal Server Error',
        });
        return;
    }
};
const getAllTransactions = async (req, res) => {
    try {
        winston_logger_1.default.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body,
            contentType: req.headers['content-type'],
        });
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const status = req.query.status;
        const paymentMethod = req.query.paymentMethod;
        const searchString = req.query.searchString;
        const searchType = req.query.searchType;
        const matchConditions = {
            ...(status && {
                $expr: {
                    $eq: [
                        { $last: '$status.status' },
                        status,
                    ],
                },
            }),
            ...(paymentMethod && {
                $expr: { $eq: ['$paymentMethod', paymentMethod] },
            }),
        };
        if (searchString) {
            if (searchType) {
                matchConditions[searchType] = {
                    $regex: searchString,
                    $options: 'i',
                };
            }
            else {
                matchConditions.$or = [
                    { payloadRefId: searchString },
                    { informationId: searchString },
                    { paymentRefNo: searchString },
                    { phoneNo: searchString },
                    { 'payingTo.wbpId': searchString },
                    { 'payingFrom.wbpId': searchString },
                ];
            }
        }
        const total = await payments_model_1.PaymentModel.countDocuments(matchConditions);
        const transactions = await payments_model_1.PaymentModel.aggregate([
            { $match: matchConditions },
            { $sort: { created_at: -1 } },
            { $skip: skip },
            { $limit: limit },
        ]);
        if (transactions.length === 0) {
            res.status(200).json({
                error: false,
                message: 'No transactions found',
                data: [],
            });
            return;
        }
        const totalPages = Math.ceil(total / limit);
        let totalSuccessfulPayment = 0;
        let totalInitiatedPayment = 0;
        for (const transaction of transactions) {
            totalInitiatedPayment += transaction.amount;
            if (transaction.status[transaction.status.length - 1].status ===
                'Success') {
                totalSuccessfulPayment += transaction.amount;
            }
        }
        const totalCount = await payments_model_1.PaymentModel.aggregate([
            {
                $addFields: {
                    lastStatus: { $arrayElemAt: ['$status', -1] },
                },
            },
            {
                $group: {
                    _id: null,
                    totalInitiatedPayment: { $sum: '$amount' },
                    totalSuccessfulPayment: {
                        $sum: {
                            $cond: [
                                { $eq: ['$lastStatus.status', 'Success'] },
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
                    totalInitiatedPayment: 1,
                    totalSuccessfulPayment: 1,
                },
            },
        ]);
        winston_logger_1.default.info('Transactions fetched successfully');
        res.status(200).json({
            error: false,
            message: 'Transactions fetched successfully',
            data: {
                currentPage: page,
                totalPages,
                totalItems: total,
                data: transactions,
                totalSuccessfulPayment: totalCount[0].totalSuccessfulPayment,
                totalInitiatedPayment: totalCount[0].totalInitiatedPayment,
            },
        });
        return;
    }
    catch (error) {
        winston_logger_1.default.error(`Error in getAllTransactions: ${error}`);
        res.status(500).json({ message: error.message });
        return;
    }
};
const getGraphDataController = async (req, res) => {
    try {
        winston_logger_1.default.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body,
        });
        const { startDate, endDate, type } = req.body;
        const graphData = await limsPayment_helper_1.paymentHelper.getGraphDataHelper(startDate, endDate, type);
        res.status(200).json({
            error: false,
            message: 'Graph data fetched successfully',
            data: graphData,
        });
    }
    catch (err) {
        winston_logger_1.default.error(`Error in getGraphDateController: ${err}`);
        res.status(500).json({
            message: `Internal Server Error: ${err.message}`,
        });
    }
};
exports.paymentController = {
    upiPaymentController,
    paymentStatusController,
    getAllTransactions,
    getGraphDataController
};
//# sourceMappingURL=limsPayment.controller.js.map