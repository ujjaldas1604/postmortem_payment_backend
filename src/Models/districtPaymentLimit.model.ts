import { Schema, model, Document } from 'mongoose';

export interface IDistrictPaymentLimit extends Document {
    name: string;
    active: boolean;
    limitAmount: number;
    createdAt: Date;
    updatedAt: Date;

}

const DistrictPaymentLimit = new Schema<IDistrictPaymentLimit>({
    name: { type: String, required: true },
    limitAmount: { type: Number, required: true },
    active: { type: Boolean, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});


export const DistrictPaymentLimitModel = model<IDistrictPaymentLimit>('DistrictPaymentLimit', DistrictPaymentLimit);
