import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../db/client.js';
import { latitudeSchema, longitudeSchema } from '@nearkin/shared';

export const discoveryQuerySchema = z.object({
  lat: latitudeSchema,
  lng: longitudeSchema,
  radius_km: z.coerce.number().min(0.1).max(50).default(5),
  category: z.string().optional(),
  only_open: z.coerce.boolean().default(false),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type DiscoveryQuery = z.infer<typeof discoveryQuerySchema>;

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
  minOrderAmount: number;
  avgDeliveryMinutes: number;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  distanceMeters: number;
}

/**
 * PostGIS-backed nearby seller query.
 *
 * Filters to non-deleted sellers, ranks by ST_Distance, and also honors each
 * seller's own delivery_radius_km — a seller that's farther than their own
 * delivery radius from the buyer is excluded even if technically within the
 * buyer's search radius.
 */
export const discoveryService = {
  async findNearbySellers(q: DiscoveryQuery): Promise<NearbySeller[]> {
    const radiusMeters = Math.round(q.radius_km * 1000);

    const result = await db.execute<{
      id: string;
      shop_name: string;
      shop_description: string | null;
      category: string | null;
      city: string;
      address: string;
      shop_lat: string;
      shop_lng: string;
      is_open: boolean;
      rating: string;
      total_orders: number;
      delivery_radius_km: number;
      min_order_amount: number;
      avg_delivery_minutes: number;
      verification_status: 'pending' | 'approved' | 'rejected';
      distance_meters: number;
    }>(sql`
      SELECT
        s.id,
        s.shop_name,
        s.shop_description,
        s.category,
        s.city,
        s.address,
        s.shop_lat,
        s.shop_lng,
        s.is_open,
        s.rating,
        s.total_orders,
        s.delivery_radius_km,
        s.min_order_amount,
        s.avg_delivery_minutes,
        s.verification_status,
        ST_Distance(s.shop_location, ST_MakePoint(${q.lng}, ${q.lat})::geography) AS distance_meters
      FROM seller_profiles s
      WHERE s.deleted_at IS NULL
        AND ST_DWithin(
          s.shop_location,
          ST_MakePoint(${q.lng}, ${q.lat})::geography,
          ${radiusMeters}
        )
        AND ST_DWithin(
          s.shop_location,
          ST_MakePoint(${q.lng}, ${q.lat})::geography,
          s.delivery_radius_km * 1000
        )
        ${q.category ? sql`AND s.category = ${q.category}` : sql``}
        ${q.only_open ? sql`AND s.is_open = true` : sql``}
      ORDER BY distance_meters ASC
      LIMIT ${q.limit}
    `);

    return result.rows.map((r) => ({
      id: r.id,
      shopName: r.shop_name,
      shopDescription: r.shop_description,
      category: r.category,
      city: r.city,
      address: r.address,
      shopLat: Number(r.shop_lat),
      shopLng: Number(r.shop_lng),
      isOpen: r.is_open,
      rating: Number(r.rating),
      totalOrders: r.total_orders,
      deliveryRadiusKm: r.delivery_radius_km,
      minOrderAmount: r.min_order_amount,
      avgDeliveryMinutes: r.avg_delivery_minutes,
      verificationStatus: r.verification_status,
      distanceMeters: Math.round(Number(r.distance_meters)),
    }));
  },
};
