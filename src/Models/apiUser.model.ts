import { Schema, model, Document } from 'mongoose';

export interface IApiUser extends Document {
    id: string;
    name: string;
    userId: string;
    password: string;
    apiKey: string;
    active: boolean;
    limitAmount: number;
    limitTimeRange: string;
}

const ApiUser = new Schema<IApiUser>({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    userId: { type: String, required: true },
    password: { type: String, required: true },
    apiKey: { type: String, required: true },
    active: { type: Boolean, required: true },
    limitAmount: { type: Number, required: true },
    limitTimeRange: { type: String, required: true },
});

ApiUser.index({ userId: 1 });

export const ApiUserModel = model<IApiUser>('ApiUser', ApiUser);
