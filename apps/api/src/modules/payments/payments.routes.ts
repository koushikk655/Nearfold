import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { webhookLimiter } from '../../middlewares/rateLimit.js';
import { validate } from '../../middlewares/validate.js';
import { paymentsController, verifyPaymentSchema } from './payments.controller.js';

const router = Router();

// Client-driven payment verification (post-checkout instant feedback)
router.post('/verify', requireAuth, validate(verifyPaymentSchema), paymentsController.verify);

router.get('/orders/:orderId', requireAuth, paymentsController.summary);

/**
 * Razorpay webhook endpoint.
 * Raw bytes are captured by the global express.json `verify` callback in
 * server.ts and read here via `req.rawBody` for HMAC signature verification.
 */
router.post('/webhook/razorpay', webhookLimiter, paymentsController.webhook);

export default router;
