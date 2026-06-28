import type { Request, Response } from 'express';
import type {
  CancelOrderInput,
  CreateOrderInput,
  PaginationQuery,
  UpdateOrderStatusInput,
} from '@nearkin/shared';
import { sendCreated, sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { UnauthorizedError } from '../../utils/errors.js';
import { ordersService } from './orders.service.js';

export const ordersController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await ordersService.createFromCart(req.user.sub, req.body as CreateOrderInput);
    sendCreated(res, result);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await ordersService.getById(req.user.sub, req.params.id!);
    sendSuccess(res, result);
  }),

  listMine: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const p = req.query as unknown as PaginationQuery;
    const result = await ordersService.listForBuyer(req.user.sub, p);
    sendSuccess(res, result, { meta: { page: p.page, limit: p.limit } });
  }),

  listForSeller: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const p = req.query as unknown as PaginationQuery;
    const result = await ordersService.listForSeller(req.user.sub, p);
    sendSuccess(res, result, { meta: { page: p.page, limit: p.limit } });
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await ordersService.sellerUpdateStatus(
      req.user.sub,
      req.params.id!,
      req.body as UpdateOrderStatusInput,
    );
    sendSuccess(res, result);
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await ordersService.buyerCancel(
      req.user.sub,
      req.params.id!,
      req.body as CancelOrderInput,
    );
    sendSuccess(res, result);
  }),
};
