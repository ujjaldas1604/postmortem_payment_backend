import logger from "../../config/winston_logger";
import { Request, Response } from "express";
// import createXlsxFile from "../../utils/createExcelFile";
import { reportHelper } from "./report.helper";
// import { createPdfBuffer } from "../../utils/excelToPdfBuffer";

const paymentReportController = async (req: Request, res: Response) => {
    try {
        logger.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body,
        });
        const { startDate, endDate }:any = req.query;
        const helperResponse = await reportHelper.paymentReportHelper(
            startDate,
            endDate
        );

        const documentName = `paymentReport${new Date().toISOString()}`;

        res.status(200).json({
            error: false,
            message: 'Payment Report fetched successfully',
            data: {
                name: documentName,
                content: helperResponse.data
            },
        });
        return
    } catch (err: any) {
        logger.error(`Error in getGraphDateController: ${err}`);
        res.status(500).json({
            error: true,
            message: `Internal Server Error: ${err.message}`,
        });
        return 
    }
}

const groupedPaymentReportController = async (req: Request, res: Response) => {
    try {
        logger.info('Incoming request', {
            path: req.originalUrl,
            method: req.method,
            payload: req.method === 'GET' ? req.query : req.body,
        });
        const { startDate, endDate }: any = req.query;
        const helperResponse =
            await reportHelper.groupedPaymentReportHelper(
                startDate,
                endDate
            );

        const documentName = `groupedPaymentReport${new Date().toISOString()}`;

        res.status(200).json({
            error: false,
            message: 'Grouped Payment Report fetched successfully',
            data: {
                name: documentName,
                content: helperResponse.data
            },
        });
        return
    } catch (err: any) {
        logger.error(`Error in getGraphDateController: ${err}`);
        res.status(500).json({
            error: true,
            message: `Internal Server Error: ${err.message}`,
        });
        return;
    }
}

export const reportController = {
    paymentReportController,
    groupedPaymentReportController,
};