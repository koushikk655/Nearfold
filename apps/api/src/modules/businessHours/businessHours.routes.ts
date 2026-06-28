import { Router } from 'express';
import { upsertBusinessHoursSchema } from '@nearkin/shared';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { businessHoursController } from './businessHours.controller.js';

const router = Router();

router.get('/seller/:sellerId', businessHoursController.listForSeller);
router.put(
  '/me',
  requireAuth,
  validate(upsertBusinessHoursSchema),
  businessHoursController.upsertMine,
);

export default router;
