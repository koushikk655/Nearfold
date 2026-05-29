// Mobile-side mirror of the backend response shapes. These intentionally
// duplicate what @nearfold/shared exports for inputs, but the RESPONSE
// shapes (entities with server-assigned fields) live here since the
// shared package only exports zod input schemas + a few enums.
//
// Source of truth: project doc 🔐 backend API contract + apps/api schema.
// Keep paise as raw integers — format at the render edge via lib/format.

export type UserRole = 'buyer' | 'seller' | 'both';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cod_pending';
export type PaymentMethod = 'razorpay' | 'cod';

/**
 * How a maker hands an item over. A maker may offer any combination.
 * NOTE: forward-compatible — these fields are optional until the backend
 * ships the fulfillment contract (see project doc "Spec — Backend:
 * fulfillment methods"). Until then, the app treats every maker as
 * delivery-only and the working flow is unchanged.
 */
export type FulfillmentMethod = 'delivery' | 'pickup' | 'shipping';

export interface Me {
  id: string;
  phone: string;
  name: string | null;
  role: UserRole;
  city: string | null;
  currentLat: number | null;
  currentLng: number | null;
  profilePhotoUrl: string | null;
  isVerified: boolean;
  createdAt: string;
}

export interface NearbySeller {
  id: string;
  shopName: string;
  shopDescription: string | null;
  category: string | null;
  city: string;
  address: string;
  shopLat: number;
  shopLng: number;
  isOpen: boolean;
  rating: number;
  totalOrders: number;
  deliveryRadiusKm: number;
  minOrderAmount: number; // paise
  avgDeliveryMinutes: number;
  verificationStatus: VerificationStatus;
  distanceMeters: number;
  /** Which hand-over methods this maker offers. Undefined → treat as ['delivery']. */
  fulfillmentMethods?: FulfillmentMethod[];
}

export interface SellerProfile {
  id: string;
  userId: string;
  shopName: string;
  shopDescription: string | null;
  category: string | null;
  shopLat: number;
  shopLng: number;
  city: string;
  address: string;
  deliveryRadiusKm: number;
  minOrderAmount: number; // paise
  avgDeliveryMinutes: number;
  isOpen: boolean;
  rating: number;
  totalOrders: number;
  verificationStatus: VerificationStatus;
  createdAt: string;
  /** Fulfillment — optional until the backend ships the contract. */
  fulfillmentMethods?: FulfillmentMethod[];
  pickupAddress?: string | null;
  shippingFee?: number | null; // paise
  shippingDays?: number | null;
}

export interface BusinessHour {
  id: string;
  sellerId: string;
  dayOfWeek: number; // 0=Sun
  openTime: string; // "HH:MM" | "HH:MM:SS"
  closeTime: string;
  isClosed: boolean;
}

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  description: string | null;
  price: number; // paise
  category: string | null;
  images: string[] | null;
  stockQuantity: number | null;
  trackInventory: boolean;
  isAvailable: boolean;
  isCustomOrder: boolean;
  leadTimeHours: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  name: string;
  unitPrice: number; // paise
  quantity: number;
  lineTotal: number; // paise
}

export interface CartTotals {
  subtotal: number;
  platformFee: number;
  totalAmount: number;
}

export interface Cart {
  cart: { id: string; sellerId: string; updatedAt: string } | null;
  items: CartItem[];
  totals: CartTotals;
}

export interface OrderItemSnapshot {
  productId: string;
  name: string;
  unitPrice: number; // paise
  quantity: number;
}

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  items: OrderItemSnapshot[];
  subtotal: number;
  platformFee: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  specialInstructions: string | null;
  cancellationReason: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  expectedDeliveryTime: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Optional until the backend ships the fulfillment contract. */
  fulfillmentMethod?: FulfillmentMethod;
}

export interface OrderStatusLog {
  id: string;
  orderId: string;
  previousStatus: string | null;
  newStatus: string;
  changedBy: string | null;
  note: string | null;
  createdAt: string;
}

export interface OrderWithLogs extends Order {
  statusLogs: OrderStatusLog[];
}

export interface Review {
  id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface Address {
  id: string;
  userId: string;
  label: string | null;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
}

/** Returned by POST /orders. razorpay is null for COD. */
export interface CreateOrderResult {
  order: Order;
  razorpay: {
    orderId: string;
    amount: number; // paise
    currency: string;
    keyId: string;
  } | null;
}
