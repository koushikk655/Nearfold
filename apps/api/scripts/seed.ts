/**
 * Dev seed — Guwahati makers.
 *
 * Nearfold is a hyperlocal *makers'* marketplace — home bakers, preserve-
 * makers, weavers, candle/soap makers. NOT food delivery. So the seed is
 * artisans with varied lead times: pickles ready in a couple hours, a
 * custom cake "made to order, 2 days", a handwoven stole "5 days".
 *
 * Run after migrations:
 *   pnpm --filter @nearfold/api db:seed
 *
 * Idempotent (deterministic UUIDs). The PostGIS shop_location column is
 * filled by the seller_profiles_sync_location trigger from shop_lat/lng.
 * In the iOS Simulator set Features → Location → Custom Location to
 * 26.1445, 91.7362 so these makers fall inside delivery range.
 */

import { createHash } from 'node:crypto';

import { db, pool } from '../src/db/client.js';
import {
  products,
  sellerBusinessHours,
  sellerProfiles,
  users,
} from '../src/db/schema.js';

// Guwahati city centre — point the simulator here.
const CENTER = { lat: 26.1445, lng: 91.7362 };

/** Deterministic UUID (v5-shaped) so seed rows are stable across runs. */
function detUuid(name: string): string {
  const h = createHash('sha1').update(`nearfold-seed:${name}`).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/** Stable placeholder image (Lorem Picsum always resolves). Swap for real
 *  Cloudinary URLs once makers upload their own photos. */
function img(seed: string): string {
  return `https://picsum.photos/seed/nf-${seed}/800/800`;
}

interface SeedProduct {
  slug: string;
  name: string;
  description: string;
  price: number; // paise
  isCustomOrder?: boolean;
  leadTimeHours?: number; // minutes→hours→days; drives the "ready in / made to order" label
}

interface SeedSeller {
  slug: string;
  shopName: string;
  shopDescription: string;
  category: string;
  lat: number;
  lng: number;
  address: string;
  minOrderAmount: number; // paise
  avgDeliveryMinutes: number;
  rating: string; // numeric(3,2)
  totalOrders: number;
  products: SeedProduct[];
}

const SELLERS: SeedSeller[] = [
  {
    slug: 'ritus-bake-studio',
    shopName: "Ritu's Bake Studio",
    shopDescription: 'Custom cakes and small-batch bakes from a home oven in Silpukhuri. Most things are made to order — tell Ritu the occasion.',
    category: 'Bakes',
    lat: 26.1488,
    lng: 91.7405,
    address: 'Silpukhuri, Guwahati',
    minOrderAmount: 30000,
    avgDeliveryMinutes: 120,
    rating: '4.8',
    totalOrders: 96,
    products: [
      { slug: 'celebration-cake', name: 'Custom Celebration Cake (½ kg)', description: 'Eggless, your theme and flavour. Buttercream or fresh cream. Tell us the occasion.', price: 120000, isCustomOrder: true, leadTimeHours: 48 },
      { slug: 'banana-loaf', name: 'Banana Walnut Loaf', description: 'Baked fresh each morning. Whole loaf, no preservatives.', price: 35000, leadTimeHours: 4 },
      { slug: 'brownie-box', name: 'Fudge Brownie Box (9)', description: 'Dense, dark, sea-salt finish.', price: 45000, isCustomOrder: true, leadTimeHours: 8 },
      { slug: 'tea-cake', name: 'Cardamom Tea Cake', description: 'Everyday loaf, lightly spiced. Good with chai.', price: 26000, leadTimeHours: 4 },
      { slug: 'sourdough', name: 'Naturally Leavened Sourdough', description: '48-hour ferment, crackly crust. Baked to order.', price: 30000, isCustomOrder: true, leadTimeHours: 24 },
    ],
  },
  {
    slug: 'kakoli-pickle-pantry',
    shopName: "Kakoli's Pickle Pantry",
    shopDescription: 'Small-batch Assamese pickles and preserves, made the old way. Jars are ready on the shelf.',
    category: 'Pickles',
    lat: 26.1402,
    lng: 91.7320,
    address: 'Uzan Bazar, Guwahati',
    minOrderAmount: 0,
    avgDeliveryMinutes: 90,
    rating: '4.9',
    totalOrders: 280,
    products: [
      { slug: 'bamboo-shoot', name: 'Bamboo Shoot Pickle 200g', description: 'Khorisa — slow-fermented, tangy, deeply local.', price: 22000, leadTimeHours: 2 },
      { slug: 'bhut-jolokia', name: 'Bhut Jolokia Pickle 100g', description: 'Ghost-pepper pickle. Handle with respect.', price: 25000, leadTimeHours: 2 },
      { slug: 'fruit-preserve', name: 'Mixed Fruit Preserve 250g', description: 'Seasonal fruit, low sugar, no pectin.', price: 19000, leadTimeHours: 2 },
      { slug: 'aam-chutney', name: 'Aam Chutney 250g', description: 'Sweet-sour raw-mango chutney, sun-cooked.', price: 16000, leadTimeHours: 2 },
    ],
  },
  {
    slug: 'loom-thread-mou',
    shopName: 'Loom & Thread by Mou',
    shopDescription: 'Handwoven textiles and handmade accessories from a Chandmari home studio. Bigger pieces are woven to order.',
    category: 'Crafts',
    lat: 26.1505,
    lng: 91.7290,
    address: 'Chandmari, Guwahati',
    minOrderAmount: 0,
    avgDeliveryMinutes: 180,
    rating: '4.7',
    totalOrders: 64,
    products: [
      { slug: 'gamosa', name: 'Handwoven Cotton Gamosa', description: 'Traditional red-and-white, pure handloom cotton.', price: 35000, leadTimeHours: 6 },
      { slug: 'eri-stole', name: 'Eri Silk Stole', description: 'Handspun eri silk, woven to order in your colour.', price: 240000, isCustomOrder: true, leadTimeHours: 120 },
      { slug: 'bamboo-tote', name: 'Handwoven Bamboo Tote', description: 'Sturdy, cotton-lined, made in small batches.', price: 60000, isCustomOrder: true, leadTimeHours: 24 },
      { slug: 'jhumka', name: 'Beaded Jhumka Earrings', description: 'Glass beads, hand-strung, feather-light.', price: 28000, leadTimeHours: 4 },
    ],
  },
  {
    slug: 'glow-co-candles',
    shopName: 'Glow Co. Candles',
    shopDescription: 'Hand-poured soy candles and cold-process soaps. Made in a Zoo Road kitchen, ready to gift.',
    category: 'Candles',
    lat: 26.1378,
    lng: 91.7448,
    address: 'Zoo Road, Guwahati',
    minOrderAmount: 0,
    avgDeliveryMinutes: 120,
    rating: '4.6',
    totalOrders: 142,
    products: [
      { slug: 'lemongrass-candle', name: 'Lemongrass Soy Candle', description: '40-hour burn, cotton wick, amber jar.', price: 45000, leadTimeHours: 3 },
      { slug: 'neem-soap', name: 'Neem & Tulsi Soap', description: 'Cold-process bar, good for oily skin.', price: 15000, leadTimeHours: 3 },
      { slug: 'candle-gift-set', name: 'Candle Gift Set of 3', description: 'Three scents, boxed and ribboned. Made to order.', price: 90000, isCustomOrder: true, leadTimeHours: 24 },
      { slug: 'beeswax-wraps', name: 'Beeswax Food Wraps (3)', description: 'Plastic-free kitchen swap, three sizes.', price: 35000, leadTimeHours: 6 },
    ],
  },
  {
    slug: 'clay-and-co',
    shopName: 'Clay & Co.',
    shopDescription: 'Wheel-thrown stoneware from a small home studio. Each piece is made to order and kiln-fired — worth the wait.',
    category: 'Ceramics',
    lat: 26.142,
    lng: 91.743,
    address: 'Rehabari, Guwahati',
    minOrderAmount: 0,
    avgDeliveryMinutes: 240,
    rating: '4.8',
    totalOrders: 73,
    products: [
      { slug: 'stoneware-mug', name: 'Hand-thrown Stoneware Mug', description: 'Wheel-thrown, glazed and kiln-fired. Each one a little different.', price: 45000, isCustomOrder: true, leadTimeHours: 168 },
      { slug: 'ceramic-planter', name: 'Speckled Ceramic Planter', description: 'Matte glaze, drainage hole, saucer included.', price: 65000, isCustomOrder: true, leadTimeHours: 168 },
      { slug: 'trinket-dish', name: 'Trinket Dish', description: 'Small dish for rings and keys. In stock, ready to go.', price: 30000, leadTimeHours: 4 },
      { slug: 'dinner-set', name: 'Dinner Plate Set (4)', description: 'Hand-thrown dinner plates, made to order in your glaze.', price: 180000, isCustomOrder: true, leadTimeHours: 168 },
    ],
  },
  {
    slug: 'anu-festive-sweets',
    shopName: "Anu's Festive Sweets",
    shopDescription: 'Festive and everyday Assamese sweets, made to order for the people who miss home.',
    category: 'Sweets',
    lat: 26.1452,
    lng: 91.7310,
    address: 'Latasil, Guwahati',
    minOrderAmount: 15000,
    avgDeliveryMinutes: 150,
    rating: '4.7',
    totalOrders: 118,
    products: [
      { slug: 'til-pitha', name: 'Til Pitha (10 pc)', description: 'Rice-flour rolls with sesame and jaggery. Made to order.', price: 26000, isCustomOrder: true, leadTimeHours: 24 },
      { slug: 'narikol-laru', name: 'Narikol Laru (12 pc)', description: 'Coconut-jaggery ladoos, rolled by hand.', price: 22000, leadTimeHours: 6 },
      { slug: 'sandesh', name: 'Sandesh (6 pc)', description: 'Soft chhena sweet, lightly cardamomed.', price: 20000, isCustomOrder: true, leadTimeHours: 12 },
      { slug: 'payokh', name: 'Payokh Jar (500 ml)', description: 'Assamese rice kheer, slow-cooked.', price: 18000, leadTimeHours: 6 },
    ],
  },
];

async function main(): Promise<void> {
  let sellerCount = 0;
  let productCount = 0;

  for (const s of SELLERS) {
    const userId = detUuid(`user:${s.slug}`);
    const sellerId = detUuid(`seller:${s.slug}`);

    await db
      .insert(users)
      .values({
        id: userId,
        phone: `+9190000${String(1000 + sellerCount).slice(-4)}`,
        name: s.shopName,
        role: 'seller',
        city: 'Guwahati',
        isVerified: true,
        isActive: true,
      })
      .onConflictDoNothing();

    await db
      .insert(sellerProfiles)
      .values({
        id: sellerId,
        userId,
        shopName: s.shopName,
        shopDescription: s.shopDescription,
        category: s.category,
        shopLat: s.lat.toFixed(8),
        shopLng: s.lng.toFixed(8),
        city: 'Guwahati',
        address: s.address,
        deliveryRadiusKm: 6,
        minOrderAmount: s.minOrderAmount,
        avgDeliveryMinutes: s.avgDeliveryMinutes,
        isOpen: true,
        rating: s.rating,
        totalOrders: s.totalOrders,
        verificationStatus: 'approved',
      })
      .onConflictDoNothing();

    await db
      .insert(sellerBusinessHours)
      .values(
        Array.from({ length: 7 }).map((_, day) => ({
          id: detUuid(`hours:${s.slug}:${day}`),
          sellerId,
          dayOfWeek: day,
          openTime: '09:00',
          closeTime: '20:00',
          isClosed: false,
        })),
      )
      .onConflictDoNothing();

    await db
      .insert(products)
      .values(
        s.products.map((p) => ({
          id: detUuid(`product:${s.slug}:${p.slug}`),
          sellerId,
          name: p.name,
          description: p.description,
          price: p.price,
          category: s.category,
          images: [img(`${s.slug}-${p.slug}-1`), img(`${s.slug}-${p.slug}-2`)],
          stockQuantity: 999,
          isAvailable: true,
          isCustomOrder: p.isCustomOrder ?? false,
          leadTimeHours: p.leadTimeHours ?? 4,
        })),
      )
      .onConflictDoNothing();

    sellerCount += 1;
    productCount += s.products.length;
  }

  // eslint-disable-next-line no-console
  console.log(
    `\n✅ Seeded ${sellerCount} makers / ${productCount} products in Guwahati.\n` +
      `   Set the iOS Simulator location to ${CENTER.lat}, ${CENTER.lng}\n` +
      `   (Features → Location → Custom Location) so they appear in range.\n`,
  );

  await pool.end();
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', err);
  process.exit(1);
});
