"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    success: 3,
    http: 4,
    debug: 5
};
const logColors = {
    error: 'red',
    warn: 'yellow',
    info: 'blue',
    success: 'green',
    http: 'magenta',
    debug: 'white'
};
winston_1.default.addColors(logColors);
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize({ all: true }), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    return `[${timestamp}] ${level}: ${typeof message === 'object' ? JSON.stringify(message, null, 2) : message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
}));
const fileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.json(), winston_1.default.format.prettyPrint());
const transports = [
    new winston_1.default.transports.Console({
        format: consoleFormat,
        level: 'debug'
    }),
    new winston_daily_rotate_file_1.default({
        filename: 'logs/application-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        format: fileFormat,
        level: 'debug'
    })
];
const logger = winston_1.default.createLogger({
    levels: logLevels,
    transports,
    exceptionHandlers: [
        new winston_1.default.transports.File({ filename: 'logs/exceptions.log', format: fileFormat })
    ]
});
exports.default = logger;
//# sourceMappingURL=winston_logger.js.map