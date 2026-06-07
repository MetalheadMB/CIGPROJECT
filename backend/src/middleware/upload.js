import multer from 'multer';
import { ApiError } from './error.js';

// Keep files in memory so we can compress / watermark with sharp before persisting.
const storage = multer.memoryStorage();

const ALLOWED = /^(image\/(jpe?g|png|webp|gif|heic|heif)|video\/(mp4|quicktime|webm|x-msvideo))$/;

export const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB / file
  fileFilter(req, file, cb) {
    if (ALLOWED.test(file.mimetype)) return cb(null, true);
    cb(new ApiError(400, `Unsupported file type: ${file.mimetype}`));
  },
});

// Bulk upload: accept up to 50 files under the field name "files"
export const bulkUpload = upload.array('files', 50);
