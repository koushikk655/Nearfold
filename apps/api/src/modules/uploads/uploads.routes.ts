import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { signedUploadSchema, uploadsController } from './uploads.controller.js';

const router = Router();
router.use(requireAuth);

router.post('/signed', validate(signedUploadSchema), uploadsController.signedUpload);

export default router;
