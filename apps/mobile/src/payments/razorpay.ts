// Razorpay Standard Checkout wrapper.
//
// react-native-razorpay is a native module — it only works in a dev build
// / EAS Build, never in Expo Go (same constraint as Firebase auth). We
// guard the require so a misconfigured environment fails with a clear
// message instead of a cryptic undefined.
//
// Flow: backend POST /orders returns { razorpay: { orderId, amount,
// currency, keyId } }. We open the sheet with that order_id; on success
// Razorpay returns the payment id + signature, which we hand to
// POST /payments/verify.

export interface RazorpayOpenOptions {
  keyId: string;
  orderId: string;
  amount: number; // paise
  currency: string;
  name: string;
  description?: string;
  prefillContact?: string;
  prefillEmail?: string;
  themeColor?: string;
}

export interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export class RazorpayCancelledError extends Error {
  constructor() {
    super('Payment cancelled');
    this.name = 'RazorpayCancelledError';
  }
}

export async function openRazorpayCheckout(
  opts: RazorpayOpenOptions,
): Promise<RazorpaySuccess> {
  let RazorpayCheckout: { open: (o: Record<string, unknown>) => Promise<RazorpaySuccess> };
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    RazorpayCheckout = require('react-native-razorpay').default;
  } catch {
    throw new Error(
      'Razorpay native module not found. Run `expo prebuild` and a dev build — ' +
        'Razorpay does not work in Expo Go.',
    );
  }

  try {
    return await RazorpayCheckout.open({
      key: opts.keyId,
      order_id: opts.orderId,
      amount: opts.amount,
      currency: opts.currency,
      name: opts.name,
      description: opts.description ?? 'Nearfold order',
      prefill: {
        contact: opts.prefillContact ?? '',
        email: opts.prefillEmail ?? '',
      },
      theme: { color: opts.themeColor ?? '#FF8A3D' },
    });
  } catch (err) {
    // react-native-razorpay rejects with { code, description } on cancel.
    const e = err as { code?: number | string; description?: string };
    // code 0 / 2 are user-cancel / payment-cancel in the SDK.
    if (e && (e.code === 0 || e.code === 2 || /cancel/i.test(e.description ?? ''))) {
      throw new RazorpayCancelledError();
    }
    throw new Error(e?.description ?? 'Payment failed. Try again.');
  }
}
