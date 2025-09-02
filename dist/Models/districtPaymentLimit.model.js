"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DistrictPaymentLimitModel = void 0;
const mongoose_1 = require("mongoose");
const DistrictPaymentLimit = new mongoose_1.Schema({
    name: { type: String, required: true },
    limitAmount: { type: Number, required: true },
    active: { type: Boolean, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
exports.DistrictPaymentLimitModel = (0, mongoose_1.model)('DistrictPaymentLimit', DistrictPaymentLimit);
//# sourceMappingURL=districtPaymentLimit.model.js.map