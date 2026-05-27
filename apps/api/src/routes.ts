import { Router } from 'express';
import addressesRoutes from './modules/addresses/addresses.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import businessHoursRoutes from './modules/businessHours/businessHours.routes.js';
import cartRoutes from './modules/cart/cart.routes.js';
import discoveryRoutes from './modules/discovery/discovery.routes.js';
import ordersRoutes from './modules/orders/orders.routes.js';
import paymentsRoutes from './modules/payments/payments.routes.js';
import productsRoutes from './modules/products/products.routes.js';
import reviewsRoutes from './modules/reviews/reviews.routes.js';
import sellersRoutes from './modules/sellers/sellers.routes.js';
import uploadsRoutes from './modules/uploads/uploads.routes.js';
import usersRoutes from './modules/users/users.routes.js';

/**
 * Mount all v1 routes under /api/v1.
 * NOTE: Payment webhook route uses its own raw-body parser — it is mounted
 * directly on the app in server.ts (BEFORE the global express.json middleware)
 * to keep the request bytes intact for HMAC verification.
 */
const v1 = Router();

v1.use('/auth', authRoutes);
v1.use('/users', usersRoutes);
v1.use('/addresses', addressesRoutes);
v1.use('/sellers', sellersRoutes);
v1.use('/business-hours', businessHoursRoutes);
v1.use('/products', productsRoutes);
v1.use('/discovery', discoveryRoutes);
v1.use('/cart', cartRoutes);
v1.use('/orders', ordersRoutes);
v1.use('/payments', paymentsRoutes);
v1.use('/reviews', reviewsRoutes);
v1.use('/uploads', uploadsRoutes);

export default v1;
