// Payments API. The /verify endpoint is the in-app confirmation after the
// Razorpay sheet succeeds — the webhook is the authoritative source, but
// verifying client-side gives instant feedback.

import { api } from './client';
import type { PaymentMethod, PaymentStatus } from './types';

export interface VerifyPaymentInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export const paymentsApi = {
  verify: (input: VerifyPaymentInput) =>
    api.post<{ verified: true; orderId: string }>('/payments/verify', input),

  status: (orderId: string) =>
    api.get<{
      orderId: string;
      totalAmount: number;
      paymentStatus: PaymentStatus;
      paymentMethod: PaymentMethod;
      razorpayOrderId: string | null;
      razorpayPaymentId: string | null;
    }>(`/payments/orders/${orderId}`),
};
