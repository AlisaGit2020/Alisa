import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import * as fs from 'fs';

/**
 * Shared configuration for CSV file uploads.
 * Used by bank import controllers (OP, S-Pankki).
 */
export const csvUploadConfig = {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (
    req: unknown,
    file: { originalname: string },
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    // Only allow CSV files
    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      return cb(new BadRequestException('Only CSV files are allowed'), false);
    }
    cb(null, true);
  },
  storage: diskStorage({
    destination: function (req, file, cb) {
      const dir = './storage';

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      // Sanitize filename to prevent path traversal
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      cb(null, Date.now() + '-' + sanitizedName);
    },
  }),
};
