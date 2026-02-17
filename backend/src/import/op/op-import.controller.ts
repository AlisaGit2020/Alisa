import {
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
import { OpImportService } from './op-import.service';
import { validate } from 'class-validator';
import { OpImportInput } from './dtos/op-import-input.dto';
import { JWTUser } from '@alisa-backend/auth/types';
import { User } from '@alisa-backend/common/decorators/user.decorator';
import { JwtAuthGuard } from '@alisa-backend/auth/jwt.auth.guard';
import { csvUploadConfig } from '@alisa-backend/common/multer/csv-upload.config';

@UseGuards(JwtAuthGuard, ThrottlerGuard)
@Controller('import/op')
export class OpImportController {
  constructor(private service: OpImportService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', csvUploadConfig))
  async uploadFile(
    @User() user: JWTUser,
    @UploadedFile() file,
    @Body('propertyId') propertyId: number,
  ) {
    if (file === undefined) {
      throw new HttpException('file must not be empty', HttpStatus.BAD_REQUEST);
    }
    const data = new OpImportInput();

    data.file = file.path;
    data.propertyId = Number(propertyId);

    const validationErrors = await validate(data);

    if (validationErrors.length > 0) {
      throw new HttpException(validationErrors, HttpStatus.BAD_REQUEST);
    }

    return await this.service.importCsv(user, data);
  }
}
