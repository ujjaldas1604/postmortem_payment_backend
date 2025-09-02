import { Schema, model, Document } from 'mongoose';

export interface IUpdateLog extends Document {
    adminId: string;
    table: string;
    key: string;
    previousValue: string;
    updatedValue: string;
    createdAt: Date;
}

const UpdateLog = new Schema<IUpdateLog>({
    adminId: { type: String, required: true },
    table: { type: String, required: true },
    key: { type: String, required: true },
    previousValue: { type: String, required: true },
    updatedValue: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});


export const UpdateLogModel = model<IUpdateLog>('UpdateLog', UpdateLog);
