import express from 'express';
import paymentRoutes from './payment';
import adminRoutes from './admin';
import miscRoutes from './misc';
import apiUsersRoutes from './apiUsers';
import districtRoutes from './district';
import reportRoutes from './report';

const router = express.Router();

router.use('/payment', paymentRoutes);

router.use('/admin', adminRoutes);

router.use('/misc', miscRoutes);

router.use('/api-users', apiUsersRoutes);

router.use('/district', districtRoutes);

router.use('/report', reportRoutes);

//legacy

export default router;
