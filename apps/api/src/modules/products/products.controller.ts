import type { Request, Response } from 'express';
import type { CreateProductInput, PaginationQuery, UpdateProductInput } from '@nearkin/shared';
import { sendCreated, sendNoContent, sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { UnauthorizedError } from '../../utils/errors.js';
import { productsService } from './products.service.js';

export const productsController = {
  listBySeller: asyncHandler(async (req: Request, res: Response) => {
    const pagination = req.query as unknown as PaginationQuery;
    const result = await productsService.listBySeller(
      req.params.sellerId!,
      pagination.page,
      pagination.limit,
    );
    sendSuccess(res, result.items, {
      meta: { total: result.total, page: result.page, limit: result.limit },
    });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const result = await productsService.getById(req.params.id!);
    sendSuccess(res, result);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await productsService.create(req.user.sub, req.body as CreateProductInput);
    sendCreated(res, result);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await productsService.update(
      req.user.sub,
      req.params.id!,
      req.body as UpdateProductInput,
    );
    sendSuccess(res, result);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    await productsService.delete(req.user.sub, req.params.id!);
    sendNoContent(res);
  }),
};
