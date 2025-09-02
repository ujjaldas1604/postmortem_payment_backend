"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModel = void 0;
const mongoose_1 = require("mongoose");
const AdminSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    userName: { type: String, required: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    otp: { type: Number },
    otpGenerationTime: { type: Date }
});
AdminSchema.index({ userName: 1 });
exports.AdminModel = (0, mongoose_1.model)("Admin", AdminSchema);
//# sourceMappingURL=admin.model.js.map