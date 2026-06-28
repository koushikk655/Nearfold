import type { Request, Response } from 'express';
import type { RequestOtpInput, VerifyOtpInput } from '@nearkin/shared';
import { sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authService } from './auth.service.js';

export const authController = {
  requestOtp: asyncHandler(async (req: Request, res: Response) => {
    const { phone } = req.body as RequestOtpInput;
    const result = await authService.requestOtp(phone);
    sendSuccess(res, result);
  }),

  verifyOtp: asyncHandler(async (req: Request, res: Response) => {
    const { phone, firebaseIdToken } = req.body as VerifyOtpInput;
    const result = await authService.verifyOtp(phone, firebaseIdToken);
    sendSuccess(res, result);
  }),
};
