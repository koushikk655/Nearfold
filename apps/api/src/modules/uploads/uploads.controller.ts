import type { Request, Response } from 'express';
import { z } from 'zod';
import { sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { UnauthorizedError } from '../../utils/errors.js';
import { cloudinaryService } from './cloudinary.service.js';

export const signedUploadSchema = z.object({
  type: z.enum(['products', 'profiles', 'shops']).default('products'),
});

export const uploadsController = {
  signedUpload: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const { type } = req.body as z.infer<typeof signedUploadSchema>;
    const folder = `nearkin/${type}/${req.user.sub}`;
    const params = cloudinaryService.generateSignedUpload(folder);
    sendSuccess(res, params);
  }),
};
