import { Router } from 'express';
import {
  createProductSchema,
  paginationQuerySchema,
  updateProductSchema,
} from '@nearkin/shared';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { productsController } from './products.controller.js';

const router = Router();

// Public: list/get
router.get(
  '/seller/:sellerId',
  validate(paginationQuerySchema, 'query'),
  productsController.listBySeller,
);
router.get('/:id', productsController.getById);

// Authenticated: manage own products
router.use(requireAuth);
router.post('/', validate(createProductSchema), productsController.create);
router.patch('/:id', validate(updateProductSchema), productsController.update);
router.delete('/:id', productsController.delete);

export default router;
