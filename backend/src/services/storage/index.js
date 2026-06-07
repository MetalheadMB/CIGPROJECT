import env from '../../config/env.js';
import { localStorage } from './local.js';
import { s3Storage } from './s3.js';

/**
 * Storage abstraction. The rest of the app only depends on this interface:
 *   save(buffer, key, mimeType) -> { key, url }
 *   delete(key)
 *   read(key) -> Buffer
 *   url(key) -> string
 *
 * Switch drivers via STORAGE_DRIVER (local | s3) with no code changes.
 */
export const storage = env.storageDriver === 's3' ? s3Storage : localStorage;

export default storage;
