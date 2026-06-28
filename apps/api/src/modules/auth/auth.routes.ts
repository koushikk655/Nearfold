import { Router } from 'express';
import { requestOtpSchema, verifyOtpSchema } from '@nearkin/shared';
import { authLimiter } from '../../middlewares/rateLimit.js';
import { validate } from '../../middlewares/validate.js';
import { authController } from './auth.controller.js';

const router = Router();

router.post('/request-otp', authLimiter, validate(requestOtpSchema), authController.requestOtp);
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), authController.verifyOtp);

export default router;
