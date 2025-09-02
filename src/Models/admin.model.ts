import { Schema, model, Document } from "mongoose";


interface IAdmin extends Document {
    id: string;
    name: string;
    phone: string;
    userName: string;
    password: string;
    otp?: number;
    otpGenerationTime?: Date
}

const AdminSchema = new Schema<IAdmin>({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    userName: { type: String, required: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    otp: { type: Number },
    otpGenerationTime: { type: Date }
});

AdminSchema.index({ userName: 1 });

export const AdminModel = model<IAdmin>("Admin", AdminSchema);