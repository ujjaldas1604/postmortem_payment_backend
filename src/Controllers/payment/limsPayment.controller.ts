import { Request, Response } from 'express';
import { config } from '../../config/config';
import logger from '../../config/winston_logger';
import getToken from '../../utils/getToken.utils';
import { PaymentModel } from '../../Models/payments.model';
import { generateUtils } from '../../utils/generate.utils';
import { paymentHelper } from './limsPayment.helper';
import { IRequestWithUserCreds } from '../../interface/global.interface';
import { runInInterval } from '../../utils/runInIntreval.utils';
import axios from 'axios';

const upiPaymentController = async (
    req: IRequestWithUserCreds,
    res: Response
): Promise<void> => {
    try {
        logger.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body,
            contentType: req.headers['content-type'],
        });

        if (config.PAYMENT_WHITELIST_MODE === 'true') {
            logger.info('Whitelist mode is enabled');
            const reqIp = (req.headers['x-forwarded-for'] as string)
                .split(',')[0]
                .trim();
            logger.info(`requested ip: ${reqIp || req.ip}`);
            if (
                !req.ip ||
                !['::1', '127.0.0.1', config.WHITELISTED_IP_1].includes(
                    reqIp || req.ip
                )
            ) {
                logger.error('Your ip is not whitelisted');
                res.status(401).json(
                    paymentHelper.encryptPaymentResponse({
                        error: true,
                        message: 'Your ip is not whitelisted',
                    })
                );
                return;
            }
        }

        const {
            rewardedBy,
            rewardedTo,
            amount,
            districtId,
            phoneNo,
            email,
            remarks,
            PostmortemID,
            paymentMethod,
        } = req.body;

        const paymentRefNo = Math.floor(Math.random() * 1000000000000000)
            .toString()
            .padStart(10, '0')
            .slice(0, 10);
        const payloadRefId =
            'CMP' +
            Math.floor(Math.random() * 1000000000000000)
                .toString()
                .padStart(10, '0')
                .slice(0, 10);

        // Generate payment details

        logger.info(`Starting db insertion in upiPaymentController`);

        if (!req.apiUser) {
            logger.error(`Authorization Failed in upiPaymentController`);
            res.status(400).json(
                paymentHelper.encryptPaymentResponse({
                    error: true,
                    message: 'Authorization Failed',
                })
            );
            return;
        }

        const limit = await paymentHelper.checkPaymentLimitStatus(
            req.apiUser?.id,
            parseInt(amount)
        );

        if (limit.error) {
            logger.error(`Error in upiPaymentController: ${limit.message}`);
            res.status(400).json(
                paymentHelper.encryptPaymentResponse({
                    error: true,
                    message: limit.message,
                })
            );
            return;
        } else {
            logger.info(limit.message);
        }

        const limit2 = await paymentHelper.checkOneUPIaDayLimitStatus(
            rewardedTo.upi
        );
        if (limit2.error) {
            logger.error(`Error in upiPaymentController: ${limit2.message}`);
            res.status(400).json(
                paymentHelper.encryptPaymentResponse({
                    error: true,
                    message: limit2.message,
                })
            );
            return;
        }else{
            logger.info(limit2.message);
        }

        const limit3 = await paymentHelper.checkDistrictWiseLimitStatus(
            rewardedBy.name.trim(),
            parseInt(amount)
        );
        if (limit3.error) {
            logger.error(`Error in upiPaymentController: ${limit3.message}`);
            res.status(400).json(
                paymentHelper.encryptPaymentResponse({
                    error: true,
                    message: limit3.message,
                })
            );
            return;
        }else{
            logger.info(limit3.message);
        }
        const limit4 = await paymentHelper.checkDesignation(
            rewardedBy.designation.trim(),
            PostmortemID
        );
        if (limit4.error) {
            logger.error(`Error in upiPaymentController: ${limit3.message}`);
            res.status(400).json(
                paymentHelper.encryptPaymentResponse({
                    error: true,
                    message: limit3.message,
                })
            );
            return;
        }else{
            logger.info(limit3.message);
        }
        await PaymentModel.create({
            id: generateUtils.generateID('PAY'),
            requestBy: req.apiUser.id,
            payingFrom: {
                ...(rewardedBy.wbpId && {
                    wbpId: rewardedBy.wbpId.trim(),
                }),
                name: rewardedBy.name.trim(),
                ...(rewardedBy.designation && {
                    designation: rewardedBy.designation,
                }),
                // accountNo: config.DEBIT_ACCOUNT_NO,
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
            paymentMethod: paymentMethod || config.PAYMENT_MODE,
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
            PostmortemID: PostmortemID,
            ...(config.NODE_ENV !== 'prod' && { staging: true }),
            remarks: remarks,
            ...(districtId && { districtId }),
            // informationId
        });
        // await PaymentModel.create(newPayment);
        logger.info('Payment inserted successfully:');

        let token = await getToken(config.CUSTOMER_ID || '');
        if (token.error) {
            await PaymentModel.updateOne(
                { paymentRefNo: paymentRefNo, payloadRefId: payloadRefId },
                {
                    $push: {
                        status: {
                            status: 'Failed',
                            date: new Date(),
                            remarks: `Payment Cancelled due to Token Generation Failure: ${token.message}`,
                        },
                    },
                }
            );
            res.status(400).json(
                paymentHelper.encryptPaymentResponse({
                    error: true,
                    message: `Payment Cancelled due to Token Generation Failure: ${token.message}`,
                })
            );
            return;
        }

        logger.info(`Token Generated, Initiating payment`);

        const paymentRequest = {
            CustomerId: config.CUSTOMER_ID || '',
            PayloadRefId: payloadRefId,
            PaymentDetails: [
                {
                    DebitAccountNo: config.DEBIT_ACCOUNT_NO,
                    ProductCode: paymentMethod || config.PAYMENT_MODE,
                    PaymentReferenceNo: paymentRefNo,
                    Amount: amount,
                    BeneficiaryName: rewardedTo.name,
                    BeneficiaryAccountNo: rewardedTo.accountNo || 'randStr', //|| '011401558745',
                    BeneficiaryIFSC: rewardedTo.ifsc || 'randStr', //|| 'ICIC0000114',
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

        const paymentResponse = await paymentHelper.makeBulkPayment(
            token.data?.token,
            paymentRequest,
            payloadRefId
        );

        if (paymentResponse.error) {
            await PaymentModel.updateOne(
                { paymentRefNo: paymentRefNo, payloadRefId: payloadRefId },
                {
                    $push: {
                        status: {
                            status: 'Failure',
                            date: new Date(),
                            remarks:
                                paymentResponse.message || 'Error in payment',
                        },
                    },
                }
            );
            logger.error(
                `Error in upiPaymentController: ${paymentResponse.message}`
            );
            res.status(400).json(
                paymentHelper.encryptPaymentResponse({
                    error: true,
                    message: paymentResponse.message || 'Error in payment',
                })
            );
            return;
        }

        if (paymentResponse.Status === 'Success') {
            await PaymentModel.updateOne(
                { paymentRefNo: paymentRefNo, payloadRefId: payloadRefId },
                {
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
                }
            );
        } else {
            await PaymentModel.updateOne(
                { paymentRefNo: paymentRefNo, payloadRefId: payloadRefId },
                {
                    $push: {
                        status: {
                            status: 'Failure',
                            date: new Date(),
                            remarks: 'Error in making payment',
                        },
                    },
                }
            );

            logger.error(
                `Error in upiPaymentController: ${paymentResponse.message}`
            );
            res.status(400).json(
                paymentHelper.encryptPaymentResponse({
                    error: true,
                    message: paymentResponse.message || 'Error in payment',
                })
            );
            return;
        }

        let statusResponse = await paymentHelper.bulkPaymentStatus(
            token.data?.token,
            config.CUSTOMER_ID as string,
            payloadRefId as string
        );

        if (statusResponse.statusCode === 610) {
            logger.warn(
                'Token expired in upiPaymentController, regenerating token'
            );
            token = await getToken(config.CUSTOMER_ID || '');
            if (token.error) {
                res.status(400).json(
                    paymentHelper.encryptPaymentResponse({
                        error: true,
                        message: `Payment status not updated due to Token Generation Failure: ${token.message}`,
                    })
                );
                return;
            }
            statusResponse = await paymentHelper.bulkPaymentStatus(
                token.data?.token,
                config.CUSTOMER_ID as string,
                payloadRefId as string
            );
        }

        if (statusResponse.error) {
            logger.error(
                `Error in upiPaymentController: ${statusResponse.message}`
            );
            res.status(400).json(
                paymentHelper.encryptPaymentResponse({
                    error: true,
                    message: statusResponse.message || 'Error in payment',
                })
            );
            return;
        }

        // Updating payment status in db
        const paymentStatus = await PaymentModel.findOneAndUpdate(
            { payloadRefId: statusResponse.PayloadRefId },
            {
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
                        processedDate: new Date(
                            statusResponse.MISData[0].ProcessedDate
                        ),
                    }),
                },
            }
        );

        runInInterval(
            payloadRefId,
            async () => {
                try {
                    let statusResponse = await paymentHelper.bulkPaymentStatus(
                        token.data?.token,
                        config.CUSTOMER_ID as string,
                        payloadRefId as string
                    );

                    if (statusResponse.statusCode === 610) {
                        logger.warn(
                            'Token expired in paymentStatus cron run In Interval, regenerating token'
                        );
                        token = await getToken(config.CUSTOMER_ID || '');
                        if (token.error) {
                            res.status(400).json(
                                paymentHelper.encryptPaymentResponse({
                                    error: true,
                                    message: `Payment status not updated due to Token Generation Failure: ${token.message}`,
                                })
                            );
                            return {
                                break: false,
                            };
                        }
                        statusResponse = await paymentHelper.bulkPaymentStatus(
                            token.data?.token,
                            config.CUSTOMER_ID as string,
                            payloadRefId as string
                        );
                    }

                    if (statusResponse.error) {
                        logger.error(
                            `Error in setInterval payment status: ${statusResponse.message}`
                        );
                        return {
                            break: false,
                        };
                    }

                    // Updating payment status in db
                    const pay = await PaymentModel.findOne({
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

                    if (
                        pay.status[pay.status.length - 1].status ===
                            statusResponse.MISData[0].Status &&
                        pay.status[pay.status.length - 1].remarks ===
                            statusResponse.MISData[0].Reason
                    ) {
                        await PaymentModel.updateOne(
                            { payloadRefId: statusResponse.PayloadRefId },
                            {
                                $set: {
                                    [`status.${pay.status.length - 1}.date`]:
                                        new Date(),
                                    ...(statusResponse.MISData[0].UTR && {
                                        UTR: statusResponse.MISData[0].UTR,
                                    }),
                                    ...(statusResponse.MISData[0]
                                        .ProcessedDate && {
                                        processedDate: new Date(
                                            statusResponse.MISData[0].ProcessedDate
                                        ),
                                    }),
                                    ...(statusResponse.MISData[0].UTR && {
                                        UTR: statusResponse.MISData[0].UTR,
                                    }),
                                },
                            }
                        );
                    } else {
                        await PaymentModel.updateOne(
                            { payloadRefId: statusResponse.PayloadRefId },
                            {
                                $push: {
                                    status: {
                                        status: statusResponse.MISData[0]
                                            .Status,
                                        date: new Date(),
                                        remarks:
                                            statusResponse.MISData[0].Reason,
                                    },
                                },
                                $set: {
                                    ...(statusResponse.MISData[0].UTR && {
                                        UTR: statusResponse.MISData[0].UTR,
                                    }),
                                },
                            }
                        );
                    }

                    if (
                        statusResponse.MISData[0].Status === 'Success' ||
                        statusResponse.MISData[0].Status === 'Failure'
                    ) {
                        //TODO need to do a LIMS API call here to update payment status
                        logger.info('Payment has been resolved');

                        const formData = new FormData();
                        formData.append(
                            'transactionId',
                            statusResponse.PayloadRefId
                        );
                        formData.append(
                            'transactionStatus',
                            statusResponse.MISData[0].Status
                        );

                        formData.append(
                            'PostmortemID',
                            PostmortemID
                        )

                        logger.info('Initiating payment resolve status update to lims');
                        const limsResponse = await axios.post(
                            config.PAYMENT_STATUS_LIMS_ENDPOINT,
                            formData,
                            {
                                headers: {
                                    Authorization:
                                        `Bearer ${config.PAYMENT_STATUS_LIMS_TOKEN}`,
                                        'Content-Type': 'multipart/form-data',
                                },
                            }
                        );

                        logger.info("payment status update response from LIMS", limsResponse.data);

                        return {
                            break: true,
                        };
                    }

                    return {
                        break: false,
                    };
                } catch (err: any) {
                    logger.error(
                        `Error in setInterval payment status check: ${err.message}`, {err}
                    );
                    return {
                        break: false,
                    };
                }
            },
            120000 // 3 minutes
        );

        res.status(200).json(
            paymentHelper.encryptPaymentResponse({
                error: false,
                payloadRefId: statusResponse.PayloadRefId,
                paymentStatus: statusResponse.MISData[0].Status,
                paymentMode: paymentStatus?.paymentMethod,
                Reason: statusResponse.MISData[0].Reason,
                data: statusResponse.MISData,
            })
        );
        return;
    } catch (err: any) {
        logger.error(`Error in upiPaymentController: ${err}`);
        res.status(500).json(
            paymentHelper.encryptPaymentResponse({
                error: true,
                message: `Internal Server Error: ${err.message}`,
            })
        );
    }
};

const paymentStatusController = async (req: Request, res: Response) => {
    try {
        logger.info('Incoming request', {
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

        const token = await getToken(config.CUSTOMER_ID as string);
        if (token.error) {
            res.status(401).json({
                error: true,
                message: `Payment Cancelled due to Token Generation Failure: ${token.message}`,
            });
            return;
        }
        const statusResponse = await paymentHelper.bulkPaymentStatus(
            token.data?.token,
            config.CUSTOMER_ID as string,
            payloadRefId as string
        );

        // Updating payment status in db
        const pay = await PaymentModel.findOne({
            payloadRefId: statusResponse.PayloadRefId,
        });

        if (!pay) {
            res.status(400).json({
                error: true,
                message: 'Payment not found',
            });
            return;
        }

        if (
            pay.status[pay.status.length - 1].status ===
                statusResponse.MISData[0].Status &&
            pay.status[pay.status.length - 1].remarks ===
                statusResponse.MISData[0].Reason
        ) {
            await PaymentModel.updateOne(
                { payloadRefId: statusResponse.PayloadRefId },
                {
                    $set: {
                        [`status.${pay.status.length - 1}.date`]: new Date(),
                        ...(statusResponse.MISData[0].UTR && {
                            UTR: statusResponse.MISData[0].UTR,
                        }),
                        ...(statusResponse.MISData[0].ProcessedDate && {
                            processedDate: new Date(
                                statusResponse.MISData[0].ProcessedDate
                            ),
                        }),
                        ...(statusResponse.MISData[0].UTR && {
                            UTR: statusResponse.MISData[0].UTR,
                        }),
                    },
                }
            );
        } else {
            await PaymentModel.updateOne(
                { payloadRefId: statusResponse.PayloadRefId },
                {
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
                }
            );
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
    } catch (error: any) {
        logger.error(`Error in paymentStatusController: ${error}`);
        res.status(500).json({
            error: true,
            message: error.message || 'Internal Server Error',
        });
        return;
    }
};

const getAllTransactions = async (req: Request, res: Response) => {
    try {
        logger.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body,
            contentType: req.headers['content-type'],
        });

        // // Get pagination parameters from query, default to page 1 and limit 10

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;
        const status = req.query.status as string;
        const paymentMethod = req.query.paymentMethod as string;
        const searchString = req.query.searchString as string;
        const searchType = req.query.searchType as string;

        // Base match conditions
        const matchConditions: any = {
            ...(status && {
                $expr: {
                    $eq: [
                        { $last: '$status.status' }, // Get last status
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
                    $options: 'i', // Case-insensitive
                };
            } else {
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

        const total = await PaymentModel.countDocuments(matchConditions);
        // TODO need to combine these to aggregations
        const transactions = await PaymentModel.aggregate([
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

        // Calculate total pages
        const totalPages = Math.ceil(total / limit);

        let totalSuccessfulPayment = 0;
        let totalInitiatedPayment = 0;
        for (const transaction of transactions) {
            totalInitiatedPayment += transaction.amount;

            if (
                transaction.status[transaction.status.length - 1].status ===
                'Success'
            ) {
                totalSuccessfulPayment += transaction.amount;
            }
        }

        const totalCount = await PaymentModel.aggregate([
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

        logger.info('Transactions fetched successfully');
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
    } catch (error: any) {
        logger.error(`Error in getAllTransactions: ${error}`);
        res.status(500).json({ message: error.message });
        return;
    }
};

const getGraphDataController = async (req: Request, res: Response) => {
    try {
        logger.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body,
        });
        const { startDate, endDate, type } = req.body;
        const graphData = await paymentHelper.getGraphDataHelper(
            startDate,
            endDate,
            type
        );
        res.status(200).json({
            error: false,
            message: 'Graph data fetched successfully',
            data: graphData,
        });
    } catch (err: any) {
        logger.error(`Error in getGraphDateController: ${err}`);
        res.status(500).json({
            message: `Internal Server Error: ${err.message}`,
        });
    }
};



export const paymentController = {
    upiPaymentController,
    paymentStatusController,
    getAllTransactions,
    getGraphDataController
};
