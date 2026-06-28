import { Router } from 'express';
import {
  registerDeviceTokenSchema,
  updateUserLocationSchema,
  updateUserProfileSchema,
} from '@nearkin/shared';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { usersController } from './users.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/me', usersController.me);
router.patch('/me', validate(updateUserProfileSchema), usersController.updateProfile);
router.patch('/me/location', validate(updateUserLocationSchema), usersController.updateLocation);
router.post(
  '/me/device-token',
  validate(registerDeviceTokenSchema),
  usersController.registerDevice,
);

export default router;
