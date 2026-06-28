-- ============================================================================
-- NearKin initial schema
-- Requires: PostgreSQL 14+ with the PostGIS extension available.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================================
-- USERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "phone" varchar(15) NOT NULL,
  "name" varchar(100),
  "role" varchar(10) NOT NULL DEFAULT 'buyer'
    CHECK (role IN ('buyer','seller','both')),
  "city" varchar(100),
  "current_lat" numeric(10,8),
  "current_lng" numeric(11,8),
  "location" geography(Point, 4326),
  "profile_photo_url" text,
  "expo_push_token" text,
  "is_verified" boolean NOT NULL DEFAULT false,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_unique" ON "users" ("phone");
CREATE INDEX IF NOT EXISTS "users_location_gix" ON "users" USING GIST ("location");

-- ============================================================================
-- SELLER PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS "seller_profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "shop_name" varchar(150) NOT NULL,
  "shop_description" text,
  "category" varchar(50),
  "shop_lat" numeric(10,8) NOT NULL,
  "shop_lng" numeric(11,8) NOT NULL,
  "shop_location" geography(Point, 4326),
  "city" varchar(100) NOT NULL,
  "address" text NOT NULL,
  "delivery_radius_km" integer NOT NULL DEFAULT 5,
  "min_order_amount" integer NOT NULL DEFAULT 0,
  "avg_delivery_minutes" integer NOT NULL DEFAULT 120,
  "is_open" boolean NOT NULL DEFAULT false,
  "rating" numeric(3,2) NOT NULL DEFAULT 0,
  "total_orders" integer NOT NULL DEFAULT 0,
  "verification_status" varchar(20) NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending','approved','rejected')),
  "deleted_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "seller_profiles_user_id_unique" ON "seller_profiles" ("user_id");
CREATE INDEX IF NOT EXISTS "seller_profiles_shop_location_gix"
  ON "seller_profiles" USING GIST ("shop_location");
CREATE INDEX IF NOT EXISTS "seller_profiles_city_idx" ON "seller_profiles" ("city");
CREATE INDEX IF NOT EXISTS "seller_profiles_is_open_idx" ON "seller_profiles" ("is_open");

-- ============================================================================
-- SELLER BUSINESS HOURS
-- ============================================================================
CREATE TABLE IF NOT EXISTS "seller_business_hours" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "seller_id" uuid NOT NULL REFERENCES "seller_profiles"("id") ON DELETE CASCADE,
  "day_of_week" integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  "open_time" time NOT NULL,
  "close_time" time NOT NULL,
  "is_closed" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "seller_business_hours_seller_day_unique"
  ON "seller_business_hours" ("seller_id", "day_of_week");

-- ============================================================================
-- ADDRESSES
-- ============================================================================
CREATE TABLE IF NOT EXISTS "addresses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "label" varchar(50),
  "address_line" text NOT NULL,
  "city" varchar(100) NOT NULL,
  "state" varchar(100) NOT NULL,
  "pincode" varchar(20) NOT NULL,
  "latitude" numeric(10,8) NOT NULL,
  "longitude" numeric(11,8) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "addresses_user_id_idx" ON "addresses" ("user_id");

-- ============================================================================
-- PRODUCTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS "products" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "seller_id" uuid NOT NULL REFERENCES "seller_profiles"("id") ON DELETE CASCADE,
  "name" varchar(200) NOT NULL,
  "description" text,
  "price" integer NOT NULL CHECK (price >= 0),
  "category" varchar(100),
  "images" text[],
  "stock_quantity" integer NOT NULL DEFAULT 999,
  "track_inventory" boolean NOT NULL DEFAULT false,
  "is_available" boolean NOT NULL DEFAULT true,
  "is_custom_order" boolean NOT NULL DEFAULT false,
  "lead_time_hours" integer NOT NULL DEFAULT 2,
  "deleted_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "products_seller_id_idx" ON "products" ("seller_id");
CREATE INDEX IF NOT EXISTS "products_category_idx" ON "products" ("category");
CREATE INDEX IF NOT EXISTS "products_available_idx"
  ON "products" ("seller_id", "is_available")
  WHERE "deleted_at" IS NULL;

-- ============================================================================
-- CARTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS "carts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "buyer_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "seller_id" uuid NOT NULL REFERENCES "seller_profiles"("id") ON DELETE CASCADE,
  "items" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "carts_buyer_seller_unique"
  ON "carts" ("buyer_id", "seller_id");

-- ============================================================================
-- ORDERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS "orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "buyer_id" uuid NOT NULL REFERENCES "users"("id"),
  "seller_id" uuid NOT NULL REFERENCES "seller_profiles"("id"),
  "items" jsonb NOT NULL,
  "subtotal" integer NOT NULL CHECK (subtotal >= 0),
  "platform_fee" integer NOT NULL CHECK (platform_fee >= 0),
  "total_amount" integer NOT NULL CHECK (total_amount >= 0),
  "status" varchar(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','preparing','out_for_delivery','delivered','cancelled')),
  "payment_status" varchar(20) NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending','paid','failed','refunded','cod_pending')),
  "payment_method" varchar(20) NOT NULL DEFAULT 'razorpay'
    CHECK (payment_method IN ('razorpay','cod')),
  "delivery_address" text NOT NULL,
  "delivery_lat" numeric(10,8) NOT NULL,
  "delivery_lng" numeric(11,8) NOT NULL,
  "special_instructions" text,
  "cancellation_reason" text,
  "razorpay_order_id" varchar(200),
  "razorpay_payment_id" varchar(200),
  "expected_delivery_time" timestamptz,
  "delivered_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "orders_buyer_id_idx" ON "orders" ("buyer_id");
CREATE INDEX IF NOT EXISTS "orders_seller_id_idx" ON "orders" ("seller_id");
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders" ("status");
CREATE INDEX IF NOT EXISTS "orders_razorpay_order_id_idx"
  ON "orders" ("razorpay_order_id") WHERE "razorpay_order_id" IS NOT NULL;

-- ============================================================================
-- ORDER STATUS LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS "order_status_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "previous_status" varchar(50),
  "new_status" varchar(50) NOT NULL,
  "changed_by" uuid REFERENCES "users"("id"),
  "note" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "order_status_logs_order_id_idx"
  ON "order_status_logs" ("order_id");

-- ============================================================================
-- REVIEWS
-- ============================================================================
CREATE TABLE IF NOT EXISTS "reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "buyer_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "seller_id" uuid NOT NULL REFERENCES "seller_profiles"("id") ON DELETE CASCADE,
  "rating" integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  "comment" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "reviews_order_unique" ON "reviews" ("order_id");
CREATE INDEX IF NOT EXISTS "reviews_seller_id_idx" ON "reviews" ("seller_id");

-- ============================================================================
-- OTP REQUESTS (rate limiting / abuse prevention)
-- ============================================================================
CREATE TABLE IF NOT EXISTS "otp_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "phone" varchar(15) NOT NULL,
  "requested_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "otp_requests_phone_requested_at_idx"
  ON "otp_requests" ("phone", "requested_at");

-- ============================================================================
-- TRIGGERS: keep geography columns in sync with lat/lng columns
-- ============================================================================
CREATE OR REPLACE FUNCTION sync_user_location() RETURNS trigger AS $$
BEGIN
  IF NEW.current_lat IS NOT NULL AND NEW.current_lng IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.current_lng, NEW.current_lat), 4326)::geography;
  ELSE
    NEW.location := NULL;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_sync_location ON "users";
CREATE TRIGGER users_sync_location
  BEFORE INSERT OR UPDATE ON "users"
  FOR EACH ROW EXECUTE FUNCTION sync_user_location();

CREATE OR REPLACE FUNCTION sync_seller_location() RETURNS trigger AS $$
BEGIN
  NEW.shop_location := ST_SetSRID(ST_MakePoint(NEW.shop_lng, NEW.shop_lat), 4326)::geography;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS seller_profiles_sync_location ON "seller_profiles";
CREATE TRIGGER seller_profiles_sync_location
  BEFORE INSERT OR UPDATE ON "seller_profiles"
  FOR EACH ROW EXECUTE FUNCTION sync_seller_location();

-- Generic updated_at trigger
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_touch_updated_at ON "products";
CREATE TRIGGER products_touch_updated_at
  BEFORE UPDATE ON "products"
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS carts_touch_updated_at ON "carts";
CREATE TRIGGER carts_touch_updated_at
  BEFORE UPDATE ON "carts"
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS orders_touch_updated_at ON "orders";
CREATE TRIGGER orders_touch_updated_at
  BEFORE UPDATE ON "orders"
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
