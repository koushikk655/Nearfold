import { Router } from 'express';
import { createReviewSchema, paginationQuerySchema } from '@nearkin/shared';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { reviewsController } from './reviews.controller.js';

const router = Router();

router.get(
  '/seller/:sellerId',
  validate(paginationQuerySchema, 'query'),
  reviewsController.listForSeller,
);
router.post('/', requireAuth, validate(createReviewSchema), reviewsController.create);

export default router;
