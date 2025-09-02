import mongoose, { Schema, model, Document, Types } from 'mongoose';

interface IPayingFrom {
    phoneNo: string;
    emailId: string;
    accountNo?: string;
}

interface IPayingTO {
    name: string;
    phoneNo: string;
    accountNo?: string;
    ifsc?: string;
    upi?: string;
}

interface IStatus {
    status: string;
    date: Date;
    remarks?: string;
}

interface IPayments extends Document {
    id: string;
    requestBy: Types.ObjectId;
    payingFrom: IPayingFrom;
    payingTo: IPayingTO;
    amount: number;
    paymentMethod: string;
    status: IStatus[];
    payloadRefId: string;
    paymentRefNo?: string;
    email: string;
    phoneNo: string;
    remarks?: string;
    districtId: string;
    staging: boolean;
    // journalNo?: string;
    // CMPReferenceNo?: string;
    UTR?: string;
    processedDate?: Date;
    informationId: string;
    created_at?: Date;
}

const PaymentSchema = new Schema<IPayments>({
    id: { type: String, required: true, unique: true },
    requestBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'AdminModel',
        required: true,
    },
    payingFrom: {
        wbpId: { type: String, required: false },
        name: { type: String, required: true },
        designation: { type: String, required: false },
        // phoneNo: { type: String, required: true },
        // emailId: { type: String, required: true },
        accountNo: { type: String, required: false },
    },
    payingTo: {
        wbpId: { type: String, required: true },
        name: { type: String, required: true },
        designation: { type: String, required: false },
        // phoneNo: { type: String, required: true },
        accountNo: { type: String, required: false },
        upi: { type: String, required: false },
        ifsc: { type: String, required: false },
    },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    status: [
        {
            status: { type: String, required: true },
            date: { type: Date, required: true },
            remarks: { type: String, required: false },
        },
    ],
    payloadRefId: { type: String, required: true },
    paymentRefNo: { type: String },
    email: { type: String },
    UTR: { type: String },
    processedDate: { type: Date },
    staging: { type: Boolean },
    // journalNo: { type: String },
    // CMPReferenceNo: { type: String },
    phoneNo: { type: String },
    remarks: { type: String },
    districtId: { type: String, required: false },
    informationId: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
});

PaymentSchema.index({payloadRefId: 1});

export const PaymentModel = model<IPayments>('Payment', PaymentSchema);
