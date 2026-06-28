import type { Request, Response } from 'express';
import type { UpsertBusinessHoursInput } from '@nearkin/shared';
import { sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { UnauthorizedError } from '../../utils/errors.js';
import { businessHoursService } from './businessHours.service.js';

export const businessHoursController = {
  listForSeller: asyncHandler(async (req: Request, res: Response) => {
    const result = await businessHoursService.list(req.params.sellerId!);
    sendSuccess(res, result);
  }),

  upsertMine: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await businessHoursService.upsertForOwner(
      req.user.sub,
      req.body as UpsertBusinessHoursInput,
    );
    sendSuccess(res, result);
  }),
};
