"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateLogModel = void 0;
const mongoose_1 = require("mongoose");
const UpdateLog = new mongoose_1.Schema({
    adminId: { type: String, required: true },
    table: { type: String, required: true },
    key: { type: String, required: true },
    previousValue: { type: String, required: true },
    updatedValue: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});
exports.UpdateLogModel = (0, mongoose_1.model)('UpdateLog', UpdateLog);
//# sourceMappingURL=updateLog.model.js.map