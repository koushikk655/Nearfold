/**
 * Drizzle ORM schema for NearKin.
 *
 * Notes on PostGIS geography columns:
 * - Drizzle has no first-class `geography` column, so we declare them as
 *   `customType` returning the raw SQL `geography(Point, 4326)`.
 * - These columns are populated by triggers (see migrations/0000_init.sql)
 *   so app code only writes `*_lat` / `*_lng` and reads either.
 */

import { sql } from 'drizzle-orm';
import {
  boolean,
  customType,
  decimal,
  integer,
  jsonb,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/** PostGIS geography(Point, 4326). Populated by trigger from lat/lng columns. */
const geographyPoint = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'geography(Point, 4326)';
  },
});

// ============================================================================
// USERS
// ============================================================================
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    phone: varchar('phone', { length: 15 }).notNull(),
    name: varchar('name', { length: 100 }),
    role: varchar('role', { length: 10 })
      .$type<'buyer' | 'seller' | 'both'>()
      .notNull()
      .default('buyer'),
    city: varchar('city', { length: 100 }),
    currentLat: decimal('current_lat', { precision: 10, scale: 8 }),
    currentLng: decimal('current_lng', { precision: 11, scale: 8 }),
    location: geographyPoint('location'),
    profilePhotoUrl: text('profile_photo_url'),
    expoPushToken: text('expo_push_token'),
    isVerified: boolean('is_verified').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    phoneUnique: uniqueIndex('users_phone_unique').on(table.phone),
  }),
);

// ============================================================================
// SELLER PROFILES
// ============================================================================
export const sellerProfiles = pgTable(
  'seller_profiles',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    shopName: varchar('shop_name', { length: 150 }).notNull(),
    shopDescription: text('shop_description'),
    category: varchar('category', { length: 50 }),
    shopLat: decimal('shop_lat', { precision: 10, scale: 8 }).notNull(),
    shopLng: decimal('shop_lng', { precision: 11, scale: 8 }).notNull(),
    shopLocation: geographyPoint('shop_location'),
    city: varchar('city', { length: 100 }).notNull(),
    address: text('address').notNull(),
    deliveryRadiusKm: integer('delivery_radius_km').notNull().default(5),
    minOrderAmount: integer('min_order_amount').notNull().default(0),
    avgDeliveryMinutes: integer('avg_delivery_minutes').notNull().default(120),
    isOpen: boolean('is_open').notNull().default(false),
    rating: decimal('rating', { precision: 3, scale: 2 }).notNull().default('0'),
    totalOrders: integer('total_orders').notNull().default(0),
    verificationStatus: varchar('verification_status', { length: 20 })
      .$type<'pending' | 'approved' | 'rejected'>()
      .notNull()
      .default('pending'),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdUnique: uniqueIndex('seller_profiles_user_id_unique').on(table.userId),
  }),
);

// ============================================================================
// SELLER BUSINESS HOURS
// ============================================================================
export const sellerBusinessHours = pgTable(
  'seller_business_hours',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    sellerId: uuid('seller_id')
      .notNull()
      .references(() => sellerProfiles.id, { onDelete: 'cascade' }),
    dayOfWeek: integer('day_of_week').notNull(), // 0 = Sunday … 6 = Saturday
    openTime: time('open_time').notNull(),
    closeTime: time('close_time').notNull(),
    isClosed: boolean('is_closed').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sellerDayUnique: uniqueIndex('seller_business_hours_seller_day_unique').on(
      table.sellerId,
      table.dayOfWeek,
    ),
  }),
);

// ============================================================================
// ADDRESSES
// ============================================================================
export const addresses = pgTable('addresses', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  label: varchar('label', { length: 50 }),
  addressLine: text('address_line').notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  pincode: varchar('pincode', { length: 20 }).notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// PRODUCTS
// ============================================================================
export const products = pgTable('products', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  sellerId: uuid('seller_id')
    .notNull()
    .references(() => sellerProfiles.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  price: integer('price').notNull(), // paise
  category: varchar('category', { length: 100 }),
  images: text('images').array(),
  stockQuantity: integer('stock_quantity').notNull().default(999),
  trackInventory: boolean('track_inventory').notNull().default(false),
  isAvailable: boolean('is_available').notNull().default(true),
  isCustomOrder: boolean('is_custom_order').notNull().default(false),
  leadTimeHours: integer('lead_time_hours').notNull().default(2),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// CARTS  (persistent, one per buyer-seller pair)
// ============================================================================
export const carts = pgTable(
  'carts',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    buyerId: uuid('buyer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    sellerId: uuid('seller_id')
      .notNull()
      .references(() => sellerProfiles.id, { onDelete: 'cascade' }),
    items: jsonb('items').notNull().default(sql`'[]'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    buyerSellerUnique: uniqueIndex('carts_buyer_seller_unique').on(table.buyerId, table.sellerId),
  }),
);

// ============================================================================
// ORDERS
// ============================================================================
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  buyerId: uuid('buyer_id')
    .notNull()
    .references(() => users.id),
  sellerId: uuid('seller_id')
    .notNull()
    .references(() => sellerProfiles.id),
  items: jsonb('items').notNull(),
  subtotal: integer('subtotal').notNull(),
  platformFee: integer('platform_fee').notNull(),
  totalAmount: integer('total_amount').notNull(),
  status: varchar('status', { length: 20 })
    .$type<
      'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'
    >()
    .notNull()
    .default('pending'),
  paymentStatus: varchar('payment_status', { length: 20 })
    .$type<'pending' | 'paid' | 'failed' | 'refunded' | 'cod_pending'>()
    .notNull()
    .default('pending'),
  paymentMethod: varchar('payment_method', { length: 20 })
    .$type<'razorpay' | 'cod'>()
    .notNull()
    .default('razorpay'),
  deliveryAddress: text('delivery_address').notNull(),
  deliveryLat: decimal('delivery_lat', { precision: 10, scale: 8 }).notNull(),
  deliveryLng: decimal('delivery_lng', { precision: 11, scale: 8 }).notNull(),
  specialInstructions: text('special_instructions'),
  cancellationReason: text('cancellation_reason'),
  razorpayOrderId: varchar('razorpay_order_id', { length: 200 }),
  razorpayPaymentId: varchar('razorpay_payment_id', { length: 200 }),
  expectedDeliveryTime: timestamp('expected_delivery_time', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// ORDER STATUS LOGS  (audit trail)
// ============================================================================
export const orderStatusLogs = pgTable('order_status_logs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  previousStatus: varchar('previous_status', { length: 50 }),
  newStatus: varchar('new_status', { length: 50 }).notNull(),
  changedBy: uuid('changed_by').references(() => users.id),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// REVIEWS
// ============================================================================
export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    buyerId: uuid('buyer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    sellerId: uuid('seller_id')
      .notNull()
      .references(() => sellerProfiles.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orderUnique: uniqueIndex('reviews_order_unique').on(table.orderId),
  }),
);

// ============================================================================
// OTP REQUEST LOG  (abuse prevention)
// ============================================================================
export const otpRequests = pgTable('otp_requests', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  phone: varchar('phone', { length: 15 }).notNull(),
  requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// Type exports for repository / service layers
// ============================================================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type SellerProfile = typeof sellerProfiles.$inferSelect;
export type NewSellerProfile = typeof sellerProfiles.$inferInsert;
export type SellerBusinessHour = typeof sellerBusinessHours.$inferSelect;
export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Cart = typeof carts.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderStatusLog = typeof orderStatusLogs.$inferSelect;
export type Review = typeof reviews.$inferSelect;
