"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiUserModel = void 0;
const mongoose_1 = require("mongoose");
const ApiUser = new mongoose_1.Schema({
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
exports.ApiUserModel = (0, mongoose_1.model)('ApiUser', ApiUser);
//# sourceMappingURL=apiUser.model.js.map