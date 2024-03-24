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
import { diskStorage } from 'multer';
import * as fs from 'fs';
import { OpImportService } from './op-import.service';
import { validate } from 'class-validator';
import { OpImportInput } from './dtos/op-import-input.dto';
import { JWTUser } from '@alisa-backend/auth/types';
import { User } from '@alisa-backend/common/decorators/user.decorator';
import { JwtAuthGuard } from '@alisa-backend/auth/jwt.auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('import/op')
export class OpImportController {
  constructor(private service: OpImportService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: function (req, file, cb) {
          const dir = './storage';

          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
          }
          cb(null, dir);
        },
        filename: function (req, file, cb) {
          cb(null, Date.now() + '-' + file.originalname);
        },
      }),
    }),
  )
  async uploadFile(
    @User() user: JWTUser,
    @UploadedFile() file,
    @Body('propertyId') propertyId: number,
    @Body('expenseTypeId') expenseTypeId: number,
    @Body('incomeTypeId') incomeTypeId: number,
  ) {
    if (file === undefined) {
      throw new HttpException('file must not be empty', HttpStatus.BAD_REQUEST);
    }
    const data = new OpImportInput();

    data.file = file.path;
    data.expenseTypeId = Number(expenseTypeId);
    data.propertyId = Number(propertyId);
    data.incomeTypeId = Number(incomeTypeId);

    const validationErrors = await validate(data);

    if (validationErrors.length > 0) {
      throw new HttpException(validationErrors, HttpStatus.BAD_REQUEST);
    }

    await this.service.importCsv(user, data);
  }
}
