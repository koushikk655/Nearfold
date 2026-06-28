import type { Request, Response } from 'express';
import type { CreateReviewInput, PaginationQuery } from '@nearkin/shared';
import { sendCreated, sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { UnauthorizedError } from '../../utils/errors.js';
import { reviewsService } from './reviews.service.js';

export const reviewsController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await reviewsService.create(req.user.sub, req.body as CreateReviewInput);
    sendCreated(res, result);
  }),

  listForSeller: asyncHandler(async (req: Request, res: Response) => {
    const p = req.query as unknown as PaginationQuery;
    const result = await reviewsService.listForSeller(req.params.sellerId!, p);
    sendSuccess(res, result, { meta: { page: p.page, limit: p.limit } });
  }),
};
