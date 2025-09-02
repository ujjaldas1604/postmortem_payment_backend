"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const winston_logger_js_1 = __importDefault(require("./winston_logger.js"));
dotenv_1.default.config();
const server = process.env.SERVER;
const database = process.env.DATABASE;
const connectDB = async () => {
    try {
        winston_logger_js_1.default.info(`[⚡]DB Connection Attempt to ${server}/${database}`);
        await mongoose_1.default.connect(`${server}/${database}`, {
            serverSelectionTimeoutMS: 60000,
            socketTimeoutMS: 85000
        });
        winston_logger_js_1.default.info('[✅]DB Connection Successful');
        console.log(`${server}/${database}`);
    }
    catch (err) {
        console.log('Failed to connect' + err.message);
        winston_logger_js_1.default.info('Database Error' + err);
    }
};
exports.default = connectDB;
//# sourceMappingURL=connectDB.js.map