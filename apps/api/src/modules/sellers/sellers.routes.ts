import { Router } from 'express';
import {
  createSellerProfileSchema,
  setShopOpenSchema,
  updateSellerProfileSchema,
  updateVerificationStatusSchema,
} from '@nearkin/shared';
import { requireAdmin, requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { sellersController } from './sellers.controller.js';

const router = Router();

// Admin: verify a seller (no auth middleware applies — uses X-Admin-Key)
router.post(
  '/:id/verification',
  requireAdmin,
  validate(updateVerificationStatusSchema),
  sellersController.setVerificationStatus,
);

// Authenticated: manage own seller profile.
// Static `/me/*` routes registered BEFORE the catch-all `/:id` lookup.
router.get('/me/profile', requireAuth, sellersController.getMine);
router.patch(
  '/me/profile',
  requireAuth,
  validate(updateSellerProfileSchema),
  sellersController.update,
);
router.post(
  '/me/open',
  requireAuth,
  validate(setShopOpenSchema),
  sellersController.setOpen,
);
router.post('/', requireAuth, validate(createSellerProfileSchema), sellersController.create);

// Public: single-seller lookup. Registered last so `/me/*` paths take precedence.
router.get('/:id', sellersController.getById);

export default router;
