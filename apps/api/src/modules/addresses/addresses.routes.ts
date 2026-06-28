import { Router } from 'express';
import { createAddressSchema, updateAddressSchema } from '@nearkin/shared';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { addressesController } from './addresses.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/', addressesController.list);
router.post('/', validate(createAddressSchema), addressesController.create);
router.patch('/:id', validate(updateAddressSchema), addressesController.update);
router.delete('/:id', addressesController.delete);

export default router;
