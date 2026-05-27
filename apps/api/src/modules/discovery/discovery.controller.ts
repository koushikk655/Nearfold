import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { discoveryService, type DiscoveryQuery } from './discovery.service.js';

export const discoveryController = {
  nearbySellers: asyncHandler(async (req: Request, res: Response) => {
    const q = req.query as unknown as DiscoveryQuery;
    const result = await discoveryService.findNearbySellers(q);
    sendSuccess(res, result, { meta: { count: result.length } });
  }),
};
