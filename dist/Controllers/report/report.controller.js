"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportController = void 0;
const winston_logger_1 = __importDefault(require("../../config/winston_logger"));
const report_helper_1 = require("./report.helper");
const paymentReportController = async (req, res) => {
    try {
        winston_logger_1.default.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body,
        });
        const { startDate, endDate } = req.query;
        const helperResponse = await report_helper_1.reportHelper.paymentReportHelper(startDate, endDate);
        const documentName = `paymentReport${new Date().toISOString()}`;
        res.status(200).json({
            error: false,
            message: 'Payment Report fetched successfully',
            data: {
                name: documentName,
                content: helperResponse.data
            },
        });
        return;
    }
    catch (err) {
        winston_logger_1.default.error(`Error in getGraphDateController: ${err}`);
        res.status(500).json({
            error: true,
            message: `Internal Server Error: ${err.message}`,
        });
        return;
    }
};
const groupedPaymentReportController = async (req, res) => {
    try {
        winston_logger_1.default.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body,
        });
        const { startDate, endDate } = req.query;
        const helperResponse = await report_helper_1.reportHelper.groupedPaymentReportHelper(startDate, endDate);
        const documentName = `groupedPaymentReport${new Date().toISOString()}`;
        res.status(200).json({
            error: false,
            message: 'Grouped Payment Report fetched successfully',
            data: {
                name: documentName,
                content: helperResponse.data
            },
        });
        return;
    }
    catch (err) {
        winston_logger_1.default.error(`Error in getGraphDateController: ${err}`);
        res.status(500).json({
            error: true,
            message: `Internal Server Error: ${err.message}`,
        });
        return;
    }
};
exports.reportController = {
    paymentReportController,
    groupedPaymentReportController,
};
//# sourceMappingURL=report.controller.js.map