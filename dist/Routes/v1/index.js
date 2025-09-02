"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const payment_1 = __importDefault(require("./payment"));
const admin_1 = __importDefault(require("./admin"));
const misc_1 = __importDefault(require("./misc"));
const apiUsers_1 = __importDefault(require("./apiUsers"));
const district_1 = __importDefault(require("./district"));
const report_1 = __importDefault(require("./report"));
const router = express_1.default.Router();
router.use('/payment', payment_1.default);
router.use('/admin', admin_1.default);
router.use('/misc', misc_1.default);
router.use('/api-users', apiUsers_1.default);
router.use('/district', district_1.default);
router.use('/report', report_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map