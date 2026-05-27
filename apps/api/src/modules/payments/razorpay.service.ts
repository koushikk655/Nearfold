import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { env, hasRazorpayConfig } from '../../config/env.js';
import { ConfigError, PaymentError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

let client: Razorpay | null = null;

function getClient(): Razorpay {
  if (!hasRazorpayConfig) {
    throw new ConfigError(
      'Razorpay is not configured. Set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET. See SETUP_THIRD_PARTY.md.',
    );
  }
  if (!client) {
    client = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID!,
      key_secret: env.RAZORPAY_KEY_SECRET!,
    });
    logger.info('Razorpay client initialized');
  }
  return client;
}

export interface CreateRazorpayOrderInput {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}

export const razorpayService = {
  publicKeyId(): string {
    return env.RAZORPAY_KEY_ID ?? '';
  },

  async createOrder(input: CreateRazorpayOrderInput) {
    const rzp = getClient();
    try {
      const order = await rzp.orders.create({
        amount: input.amountPaise,
        currency: 'INR',
        receipt: input.receipt,
        payment_capture: true,
        notes: input.notes ?? {},
      });
      return {
        id: order.id,
        amount: Number(order.amount),
        currency: order.currency,
        receipt: order.receipt ?? '',
      };
    } catch (err) {
      logger.error({ err }, 'Failed to create Razorpay order');
      throw new PaymentError('Failed to create Razorpay order');
    }
  },

  /**
   * Verify the HMAC SHA256 signature provided in the Razorpay webhook header.
   * Returns true iff the signature matches the configured webhook secret.
   */
  verifyWebhookSignature(rawBody: string, signatureHeader: string | undefined): boolean {
    if (!signatureHeader) return false;
    if (!env.RAZORPAY_WEBHOOK_SECRET) {
      throw new ConfigError('RAZORPAY_WEBHOOK_SECRET not configured');
    }
    const expected = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');
    try {
      return crypto.timingSafeEqual(
        Buffer.from(expected, 'utf8'),
        Buffer.from(signatureHeader, 'utf8'),
      );
    } catch {
      return false;
    }
  },

  /**
   * Manual signature verification for the on-success callback from the client
   * (using razorpay_order_id + razorpay_payment_id + razorpay_signature).
   */
  verifyPaymentSignature(input: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): boolean {
    if (!env.RAZORPAY_KEY_SECRET) {
      throw new ConfigError('RAZORPAY_KEY_SECRET not configured');
    }
    const expected = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
      .digest('hex');
    try {
      return crypto.timingSafeEqual(
        Buffer.from(expected, 'utf8'),
        Buffer.from(input.razorpaySignature, 'utf8'),
      );
    } catch {
      return false;
    }
  },
};
