import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from './winston_logger.js';

dotenv.config();

const server = process.env.SERVER;
const database = process.env.DATABASE;

const connectDB = async (): Promise<void> => {
    try {
        logger.info(`[⚡]DB Connection Attempt to ${server}/${database}`);
        await mongoose.connect(`${server}/${database}`, {
            serverSelectionTimeoutMS: 60000, // Increase timeout to 30s
            socketTimeoutMS: 85000 // Increase socket timeout
        });
        logger.info('[✅]DB Connection Successful');
        console.log(`${server}/${database}`);
    } catch (err: any) {
        console.log('Failed to connect' + err.message);
        logger.info('Database Error' + err);
    }
};

export default connectDB;
