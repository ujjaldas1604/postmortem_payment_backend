"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const district_controller_1 = require("../../../Controllers/district/district.controller");
const adminAuthorization_middleware_1 = __importDefault(require("../../../middleware/adminAuthorization.middleware"));
const router = (0, express_1.Router)();
router.get('/get-all-districts', adminAuthorization_middleware_1.default, district_controller_1.districtController.getDistrictListController);
router.post('/update-district-active-status', adminAuthorization_middleware_1.default, district_controller_1.districtController.updateDistrictActiveStatusController);
router.post('/update-district-monthly-limit', adminAuthorization_middleware_1.default, district_controller_1.districtController.updateDistrictMonthlyLimitController);
router.post('/create-new-district', adminAuthorization_middleware_1.default, district_controller_1.districtController.createNewDistrictController);
exports.default = router;
//# sourceMappingURL=index.js.map