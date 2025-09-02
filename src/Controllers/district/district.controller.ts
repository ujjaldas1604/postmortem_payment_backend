import logger from '../../config/winston_logger';
import { Request, Response } from 'express';
import { districtHelper } from './district.helper';
const getDistrictListController = async (req: Request, res: Response) => {
    try {
        logger.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body,
        });
        const helperResponse = await districtHelper.getDistrictListHelper();
        if (helperResponse.error) {
            logger.error(
                `Error in getDistrictListController: ${helperResponse.message}`
            );
            res.status(500).json({
                error: true,
                message: helperResponse.message || 'Internal Server Error',
            });
            return;
        }
        res.status(200).json({
            data: helperResponse.data,
        });
        return;
    } catch (err: any) {
        logger.error(`Error in getDistrictListController: ${err}`);
        res.status(500).json({
            message: err.message || 'Internal Server Error',
        });
        return;
    }
};

const updateDistrictActiveStatusController = async (
    req: Request,
    res: Response
) => {
    try {
        logger.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body,
        });
        const { id, activeStatus } = req.body;
        const helperResponse =
            await districtHelper.updateDistrictActiveStatusHelper(id, activeStatus);
        if (helperResponse.error) {
            logger.error(
                `Error in updateDistrictActiveStatusController: ${helperResponse.message}`
            );
            res.status(500).json({
                error: true,
                message: helperResponse.message || 'Internal Server Error',
                data: helperResponse.data
            });
            return;
        }
        res.status(200).json({
            error: false,
            message: helperResponse.message,
            data: helperResponse.data,
        });
        return;
    } catch (err: any) {
        logger.error(`Error in updateDistrictActiveStatusController: ${err}`);
        res.status(500).json({
            error: false,
            message: err.message || 'Internal Server Error',
        });
        return;
    }
};

const updateDistrictMonthlyLimitController = async (
    req: Request,
    res: Response
) => {
    try {
        logger.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body,
        });
        const { id, monthlyLimit } = req.body;
        const helperResponse =
            await districtHelper.updateDistrictMonthlyLimitHelper(
                id,
                monthlyLimit
            );
        if (helperResponse.error) {
            logger.error(
                `Error in updateDistrictMonthlyLimitController: ${helperResponse.message}`
            );
            res.status(500).json({
                error: true,
                message: helperResponse.message || 'Internal Server Error',
            });
            return;
        }
        res.status(200).json({
            error: false,
            message: helperResponse.message,
            data: helperResponse.data,
        });
        return;
    } catch (err: any) {
        logger.error(`Error in updateDistrictMonthlyLimitController: ${err}`);
        res.status(500).json({
            error: false,
            message: err.message || 'Internal Server Error',
        });
        return;
    }
};

const createNewDistrictController = async (req: Request, res: Response) => {
    try {
        logger.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body,
        });

        const { name,  monthlyLimit, activeStatus } = req.body;
        const helperResponse = await districtHelper.createNewDistrictHelper(name, monthlyLimit, activeStatus);
        if (helperResponse.error) {
            logger.error(
                `Error in createNewDistrictController: ${helperResponse.message}`
            );
            res.status(500).json({
                error: true,
                message: helperResponse.message || 'Internal Server Error',
            });
            return;
        }
        res.status(200).json({
            error: false,
            message: helperResponse.message,
            data: helperResponse.data,
        });
        return;
    } catch (err: any) {
        logger.error(`Error in createNewDistrictController: ${err}`);
        res.status(500).json({
            error: false,
            message: err.message || 'Internal Server Error',
        });
        return;
    }
}

export const districtController = {
    getDistrictListController,
    updateDistrictActiveStatusController,
    updateDistrictMonthlyLimitController,
    createNewDistrictController
};
