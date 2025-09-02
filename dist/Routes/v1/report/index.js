"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminAuthorization_middleware_1 = __importDefault(require("../../../middleware/adminAuthorization.middleware"));
const report_controller_1 = require("../../../Controllers/report/report.controller");
const router = express_1.default.Router();
router.get('/get-report', adminAuthorization_middleware_1.default, report_controller_1.reportController.paymentReportController);
router.get('/get-district-wise-report', adminAuthorization_middleware_1.default, report_controller_1.reportController.groupedPaymentReportController);
exports.default = router;
//# sourceMappingURL=index.js.map