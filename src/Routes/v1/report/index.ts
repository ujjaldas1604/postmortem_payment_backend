import express from 'express';
import adminAuthorizationMiddleware from '../../../middleware/adminAuthorization.middleware';
import { reportController } from '../../../Controllers/report/report.controller';


const router = express.Router();


router.get(
    '/get-report',
    adminAuthorizationMiddleware,
    reportController.paymentReportController
);
router.get(
    '/get-district-wise-report',
    adminAuthorizationMiddleware,
    reportController.groupedPaymentReportController
);


export default router