import {
  BadRequestException,
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ThrottlerGuard } from '@nestjs/throttler';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import { SPankkiImportService } from './s-pankki-import.service';
import { validate } from 'class-validator';
import { SPankkiImportInput } from './dtos/s-pankki-import-input.dto';
import { JWTUser } from '@alisa-backend/auth/types';
import { User } from '@alisa-backend/common/decorators/user.decorator';
import { JwtAuthGuard } from '@alisa-backend/auth/jwt.auth.guard';

@UseGuards(JwtAuthGuard, ThrottlerGuard)
@Controller('import/s-pankki')
export class SPankkiImportController {
  constructor(private service: SPankkiImportService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
      },
      fileFilter: (req, file, cb) => {
        // Only allow CSV files
        if (!file.originalname.toLowerCase().endsWith('.csv')) {
          return cb(
            new BadRequestException('Only CSV files are allowed'),
            false,
          );
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
    }),
  )
  async uploadFile(
    @User() user: JWTUser,
    @UploadedFile() file,
    @Body('propertyId') propertyId: number,
  ) {
    if (file === undefined) {
      throw new HttpException('file must not be empty', HttpStatus.BAD_REQUEST);
    }
    const data = new SPankkiImportInput();

    data.file = file.path;
    data.propertyId = Number(propertyId);

    const validationErrors = await validate(data);

    if (validationErrors.length > 0) {
      throw new HttpException(validationErrors, HttpStatus.BAD_REQUEST);
    }

    return await this.service.importCsv(user, data);
  }
}