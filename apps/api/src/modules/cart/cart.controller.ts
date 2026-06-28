import type { Request, Response } from 'express';
import type { AddToCartInput, UpdateCartItemInput } from '@nearkin/shared';
import { sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { UnauthorizedError } from '../../utils/errors.js';
import { cartService } from './cart.service.js';

export const cartController = {
  get: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await cartService.get(req.user.sub);
    sendSuccess(res, result);
  }),

  add: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await cartService.addItem(req.user.sub, req.body as AddToCartInput);
    sendSuccess(res, result);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await cartService.updateItem(req.user.sub, req.body as UpdateCartItemInput);
    sendSuccess(res, result);
  }),

  clear: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await cartService.clear(req.user.sub);
    sendSuccess(res, result);
  }),
};
