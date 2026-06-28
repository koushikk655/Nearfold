import type { Request, Response } from 'express';
import type { CreateAddressInput, UpdateAddressInput } from '@nearkin/shared';
import { sendCreated, sendNoContent, sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { UnauthorizedError } from '../../utils/errors.js';
import { addressesService } from './addresses.service.js';

export const addressesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await addressesService.list(req.user.sub);
    sendSuccess(res, result);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await addressesService.create(req.user.sub, req.body as CreateAddressInput);
    sendCreated(res, result);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await addressesService.update(
      req.user.sub,
      req.params.id!,
      req.body as UpdateAddressInput,
    );
    sendSuccess(res, result);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    await addressesService.delete(req.user.sub, req.params.id!);
    sendNoContent(res);
  }),
};
