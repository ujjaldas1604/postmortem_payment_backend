"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PaymentSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true },
    requestBy: {
        type: mongoose_1.default.Schema.ObjectId,
        ref: 'AdminModel',
        required: true,
    },
    payingFrom: {
        wbpId: { type: String, required: false },
        name: { type: String, required: true },
        designation: { type: String, required: false },
        accountNo: { type: String, required: false },
    },
    payingTo: {
        wbpId: { type: String, required: true },
        name: { type: String, required: true },
        designation: { type: String, required: false },
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
    phoneNo: { type: String },
    remarks: { type: String },
    districtId: { type: String, required: false },
    informationId: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
});
PaymentSchema.index({ payloadRefId: 1 });
exports.PaymentModel = (0, mongoose_1.model)('Payment', PaymentSchema);
//# sourceMappingURL=payments.model.js.map