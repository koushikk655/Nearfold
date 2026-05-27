import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { discoveryController } from './discovery.controller.js';
import { discoveryQuerySchema } from './discovery.service.js';

const router = Router();

router.get(
  '/nearby-sellers',
  validate(discoveryQuerySchema, 'query'),
  discoveryController.nearbySellers,
);

export default router;
