import { Router } from 'express';
import {
  cancelOrderSchema,
  createOrderSchema,
  paginationQuerySchema,
  updateOrderStatusSchema,
} from '@nearkin/shared';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { ordersController } from './orders.controller.js';

const router = Router();
router.use(requireAuth);

// Buyer
router.post('/', validate(createOrderSchema), ordersController.create);
router.get('/mine', validate(paginationQuerySchema, 'query'), ordersController.listMine);
router.post('/:id/cancel', validate(cancelOrderSchema), ordersController.cancel);

// Seller
router.get(
  '/seller/incoming',
  validate(paginationQuerySchema, 'query'),
  ordersController.listForSeller,
);
router.patch('/:id/status', validate(updateOrderStatusSchema), ordersController.updateStatus);

// Either party
router.get('/:id', ordersController.getById);

export default router;
