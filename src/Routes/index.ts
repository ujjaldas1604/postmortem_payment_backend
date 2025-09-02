import express from 'express';
import v1Routes from './v1';
// import legacyRoutes from './getdata.routes'

const router = express.Router();

router.use('/v1', v1Routes);

// router.use('/getdata', legacyRoutes);

export default router;
