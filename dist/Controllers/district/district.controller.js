"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.districtController = void 0;
const winston_logger_1 = __importDefault(require("../../config/winston_logger"));
const district_helper_1 = require("./district.helper");
const getDistrictListController = async (req, res) => {
    try {
        winston_logger_1.default.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body,
        });
        const helperResponse = await district_helper_1.districtHelper.getDistrictListHelper();
        if (helperResponse.error) {
            winston_logger_1.default.error(`Error in getDistrictListController: ${helperResponse.message}`);
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
    }
    catch (err) {
        winston_logger_1.default.error(`Error in getDistrictListController: ${err}`);
        res.status(500).json({
            message: err.message || 'Internal Server Error',
        });
        return;
    }
};
const updateDistrictActiveStatusController = async (req, res) => {
    try {
        winston_logger_1.default.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body,
        });
        const { id, activeStatus } = req.body;
        const helperResponse = await district_helper_1.districtHelper.updateDistrictActiveStatusHelper(id, activeStatus);
        if (helperResponse.error) {
            winston_logger_1.default.error(`Error in updateDistrictActiveStatusController: ${helperResponse.message}`);
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
    }
    catch (err) {
        winston_logger_1.default.error(`Error in updateDistrictActiveStatusController: ${err}`);
        res.status(500).json({
            error: false,
            message: err.message || 'Internal Server Error',
        });
        return;
    }
};
const updateDistrictMonthlyLimitController = async (req, res) => {
    try {
        winston_logger_1.default.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body,
        });
        const { id, monthlyLimit } = req.body;
        const helperResponse = await district_helper_1.districtHelper.updateDistrictMonthlyLimitHelper(id, monthlyLimit);
        if (helperResponse.error) {
            winston_logger_1.default.error(`Error in updateDistrictMonthlyLimitController: ${helperResponse.message}`);
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
    }
    catch (err) {
        winston_logger_1.default.error(`Error in updateDistrictMonthlyLimitController: ${err}`);
        res.status(500).json({
            error: false,
            message: err.message || 'Internal Server Error',
        });
        return;
    }
};
const createNewDistrictController = async (req, res) => {
    try {
        winston_logger_1.default.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body,
        });
        const { name, monthlyLimit, activeStatus } = req.body;
        const helperResponse = await district_helper_1.districtHelper.createNewDistrictHelper(name, monthlyLimit, activeStatus);
        if (helperResponse.error) {
            winston_logger_1.default.error(`Error in createNewDistrictController: ${helperResponse.message}`);
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
    }
    catch (err) {
        winston_logger_1.default.error(`Error in createNewDistrictController: ${err}`);
        res.status(500).json({
            error: false,
            message: err.message || 'Internal Server Error',
        });
        return;
    }
};
exports.districtController = {
    getDistrictListController,
    updateDistrictActiveStatusController,
    updateDistrictMonthlyLimitController,
    createNewDistrictController
};
//# sourceMappingURL=district.controller.js.map