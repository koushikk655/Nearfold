import { Router } from 'express';
import { addToCartSchema, updateCartItemSchema } from '@nearkin/shared';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { cartController } from './cart.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/', cartController.get);
router.post('/items', validate(addToCartSchema), cartController.add);
router.patch('/items', validate(updateCartItemSchema), cartController.update);
router.delete('/', cartController.clear);

export default router;
