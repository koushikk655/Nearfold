import type { Request, Response } from 'express';
import type {
  RegisterDeviceTokenInput,
  UpdateUserLocationInput,
  UpdateUserProfileInput,
} from '@nearkin/shared';
import { sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { UnauthorizedError } from '../../utils/errors.js';
import { usersService } from './users.service.js';

export const usersController = {
  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await usersService.getMe(req.user.sub);
    sendSuccess(res, result);
  }),

  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await usersService.updateProfile(req.user.sub, req.body as UpdateUserProfileInput);
    sendSuccess(res, result);
  }),

  updateLocation: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await usersService.updateLocation(req.user.sub, req.body as UpdateUserLocationInput);
    sendSuccess(res, result);
  }),

  registerDevice: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await usersService.registerDeviceToken(
      req.user.sub,
      req.body as RegisterDeviceTokenInput,
    );
    sendSuccess(res, result);
  }),
};
