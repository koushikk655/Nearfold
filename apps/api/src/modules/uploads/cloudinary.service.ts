import crypto from 'node:crypto';
import { env, hasCloudinaryConfig } from '../../config/env.js';
import { ConfigError } from '../../utils/errors.js';

export interface SignedUploadParams {
  timestamp: number;
  folder: string;
  signature: string;
  apiKey: string;
  cloudName: string;
}

/**
 * Returns parameters the client can use to POST directly to Cloudinary
 * (so the file bytes never go through our API server).
 *
 * Client uploads to:
 *   POST https://api.cloudinary.com/v1_1/{cloud_name}/image/upload
 * with body fields: file, timestamp, signature, api_key, folder
 */
export const cloudinaryService = {
  generateSignedUpload(folder: string): SignedUploadParams {
    if (!hasCloudinaryConfig) {
      throw new ConfigError(
        'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET. See SETUP_THIRD_PARTY.md.',
      );
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const safeFolder = folder.replace(/[^a-zA-Z0-9_/-]/gu, '');
    const toSign = `folder=${safeFolder}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash('sha1')
      .update(`${toSign}${env.CLOUDINARY_API_SECRET}`)
      .digest('hex');

    return {
      timestamp,
      folder: safeFolder,
      signature,
      apiKey: env.CLOUDINARY_API_KEY!,
      cloudName: env.CLOUDINARY_CLOUD_NAME!,
    };
  },
};
