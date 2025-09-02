import { NextFunction, Request, RequestHandler, Response } from 'express';
import logger from '../config/winston_logger';

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    logger.error(`Error: ${message}`, {
        method: req.method,
        url: req.originalUrl,
        statusCode,
        stack: err.stack || 'No stack trace available'
    });

    res.status(statusCode).json({
        error: true,
        code: 'ERR_GLOBAL_00001',
        message: message,
        data: null
    });
};

export const handle404: RequestHandler = (req: Request, res: Response, _next: NextFunction) => {
    const message = `Can't find ${req.originalUrl} on this server!`;

    logger.warn(`404 Not Found: ${message}`, {
        method: req.method,
        url: req.originalUrl
    });

    res.status(404).json({
        error: true,
        code: 'ERR_GLOBAL_00001',
        message: `Can't find ${req.originalUrl} on this server!`,
        data: null
    });
};
