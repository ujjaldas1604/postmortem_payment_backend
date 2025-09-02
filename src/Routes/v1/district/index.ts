import { Router } from "express";
import { districtController } from "../../../Controllers/district/district.controller";
import adminAuthorizationMiddleware from "../../../middleware/adminAuthorization.middleware";

const router = Router();

router.get('/get-all-districts', adminAuthorizationMiddleware, districtController.getDistrictListController);
router.post('/update-district-active-status', adminAuthorizationMiddleware, districtController.updateDistrictActiveStatusController);
router.post('/update-district-monthly-limit', adminAuthorizationMiddleware, districtController.updateDistrictMonthlyLimitController);
router.post('/create-new-district', adminAuthorizationMiddleware, districtController.createNewDistrictController);

export default router