import { Request, Response } from 'express';
import logger from '../../config/winston_logger';
import { ApiUserModel } from '../../Models/apiUser.model';

const getAllApiUsers = async (req: Request, res: Response) => {
    try {
        logger.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body,
        });

        const data = await ApiUserModel.aggregate([
            {
                $lookup: {
                    from: 'payments',
                    let: { id: '$_id', timeRange: '$limitTimeRange' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$requestBy', '$$id'] },
                                        {
                                            $cond: [
                                                {
                                                    $eq: [
                                                        '$$timeRange',
                                                        'weekly',
                                                    ],
                                                },
                                                // Current week condition (Monday to now)
                                                {
                                                    $gte: [
                                                        '$created_at',
                                                        {
                                                            $dateFromParts: {
                                                                isoWeekYear: {
                                                                    $year: new Date(),
                                                                },
                                                                isoWeek: {
                                                                    $week: new Date(),
                                                                },
                                                                isoDayOfWeek: 1, // Monday
                                                            },
                                                        },
                                                    ],
                                                },
                                                // Monthly condition (default)
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
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                        {
                            $addFields: {
                                lastStatus: { $arrayElemAt: ['$status', -1] },
                            },
                        },
                        {
                            $match: {
                                'lastStatus.status': 'Success',
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                totalAmount: { $sum: '$amount' },
                            },
                        },
                    ],
                    as: 'user_requests_amount',
                },
            },
            {
                $addFields: {
                    usedAmount: {
                        $ifNull: [
                            {
                                $arrayElemAt: [
                                    '$user_requests_amount.totalAmount',
                                    0,
                                ],
                            },
                            0,
                        ],
                    },
                },
            },
            {
                $project: {
                    _id: 1,
                    usedAmount: 1,
                    name: 1,
                    limitAmount: 1,
                    limitTimeRange: 1,
                    active: 1,
                },
            },
        ]);

        res.status(200).json(data);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

const updateApiUserSettingsController = async (req: Request, res: Response) => {
    try {
        logger.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body,
        });

        const { id, limitAmount, limitTimeRange, active } = req.body;
        const result = await ApiUserModel.updateOne(
            { _id: id },
            {
                $set: {
                    ...(limitAmount && { limitAmount }),
                    ...(limitTimeRange && { limitTimeRange }),
                    ...(active !== undefined && { active }),
                },
            }
        );

        logger.info('User settings updated', {
            result
        })
        logger.info('test', {
            a:result.modifiedCount,
            b: result.matchedCount
        })
        // Check if document was found and updated
        if (result.matchedCount === 0) {
            res.status(400).json({
                error: true,
                message: 'No user found with the given id User not found',
            });
            return;
        }

        if (result.modifiedCount === 0) {
            res.status(200).json({
                error: false,
                message:
                    'No changes made (new values are same as existing ones)',
            });
            return;
        }

        res.status(200).json({
            error: false,
            message: 'Settings updated successfully',
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const apiUsersController = {
    getAllApiUsers,
    updateApiUserSettingsController,
};
