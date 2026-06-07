import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import env from '../../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// backend/uploads
const UPLOAD_DIR = path.resolve(__dirname, '../../../uploads');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Local-disk storage driver. Files are written under backend/uploads and
 * served statically by Express at `${PUBLIC_URL}/uploads/...`.
 */
export const localStorage = {
  driver: 'local',

  async save(buffer, key, _mimeType) {
    const full = path.join(UPLOAD_DIR, key);
    await ensureDir(path.dirname(full));
    await fs.writeFile(full, buffer);
    return {
      key,
      url: `${env.publicUrl}/uploads/${key}`,
    };
  },

  async delete(key) {
    try {
      await fs.unlink(path.join(UPLOAD_DIR, key));
    } catch {
      /* already gone */
    }
  },

  // For the local driver we need the raw bytes back (e.g. to watermark on download)
  async read(key) {
    return fs.readFile(path.join(UPLOAD_DIR, key));
  },

  url(key) {
    return `${env.publicUrl}/uploads/${key}`;
  },
};

export { UPLOAD_DIR };
