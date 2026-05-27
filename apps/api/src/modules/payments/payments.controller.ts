import type { Request, Response } from 'express';
import { z } from 'zod';
import { sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { PaymentError, UnauthorizedError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { paymentsService } from './payments.service.js';
import { razorpayService } from './razorpay.service.js';

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});

export const paymentsController = {
  verify: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const body = req.body as z.infer<typeof verifyPaymentSchema>;
    const result = await paymentsService.verifyClientPayment({
      actorUserId: req.user.sub,
      razorpayOrderId: body.razorpayOrderId,
      razorpayPaymentId: body.razorpayPaymentId,
      razorpaySignature: body.razorpaySignature,
    });
    sendSuccess(res, result);
  }),

  summary: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await paymentsService.getOrderPaymentSummary(req.user.sub, req.params.orderId!);
    sendSuccess(res, result);
  }),

  /**
   * Razorpay webhook. Verifies HMAC signature against the raw body, then
   * dispatches to paymentsService. Uses Express raw-body middleware (mounted
   * at the route level) so we can verify the signature byte-exact.
   */
  webhook: asyncHandler(async (req: Request, res: Response) => {
    const signature = req.header('x-razorpay-signature');
    const rawBody =
      (req as unknown as { rawBody?: Buffer }).rawBody?.toString('utf8') ??
      JSON.stringify(req.body);

    const valid = razorpayService.verifyWebhookSignature(rawBody, signature);
    if (!valid) {
      logger.warn({ signature }, 'Invalid Razorpay webhook signature');
      throw new PaymentError('Invalid webhook signature');
    }

    const result = await paymentsService.handleWebhookEvent(
      req.body as { event: string; payload: Record<string, unknown> },
    );
    sendSuccess(res, result);
  }),
};
