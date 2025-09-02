import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    success: 3,
    http: 4,
    debug: 5
};

// Custom color scheme for console
const logColors = {
    error: 'red',
    warn: 'yellow',
    info: 'blue',
    success: 'green',
    http: 'magenta',
    debug: 'white'
};
winston.addColors(logColors);

// Format for console (human-readable)
const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return `[${timestamp}] ${level}: ${typeof message === 'object' ? JSON.stringify(message, null, 2) : message} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
        }`;
    })
);

// Format for files (structured JSON but pretty-printed)
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json(),
    winston.format.prettyPrint() // Makes JSON multi-line and indented
);

const transports = [
    // Console (colored and simplified)
    new winston.transports.Console({
        format: consoleFormat,
        level: 'debug'
    }),
    // File transport (pretty-printed JSON)
    new DailyRotateFile({
        filename: 'logs/application-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        format: fileFormat,
        level: 'debug'
    })
];

const logger = winston.createLogger({
    levels: logLevels,
    transports,
    // Handle uncaught exceptions
    exceptionHandlers: [
        new winston.transports.File({ filename: 'logs/exceptions.log', format: fileFormat })
    ]
});

export default logger;