import type { Request, Response } from 'express';
import type {
  CreateSellerProfileInput,
  UpdateSellerProfileInput,
  VerificationStatus,
} from '@nearkin/shared';
import { sendCreated, sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { UnauthorizedError } from '../../utils/errors.js';
import { sellersService } from './sellers.service.js';

export const sellersController = {
  getMine: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await sellersService.getMine(req.user.sub);
    sendSuccess(res, result);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const result = await sellersService.getById(req.params.id!);
    sendSuccess(res, result);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await sellersService.create(
      req.user.sub,
      req.body as CreateSellerProfileInput,
    );
    sendCreated(res, result);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await sellersService.update(req.user.sub, req.body as UpdateSellerProfileInput);
    sendSuccess(res, result);
  }),

  setOpen: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const { isOpen } = req.body as { isOpen: boolean };
    const result = await sellersService.setShopOpen(req.user.sub, isOpen);
    sendSuccess(res, result);
  }),

  setVerificationStatus: asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body as { status: VerificationStatus };
    const result = await sellersService.updateVerificationStatus(req.params.id!, status);
    sendSuccess(res, result);
  }),
};
