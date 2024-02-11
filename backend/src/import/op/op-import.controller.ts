import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import { OpImportService } from './op-import.service';

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
          cb(null, file.originalname + '-' + Date.now());
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFile() file,
    @Body('propertyId') propertyId: number,
    @Body('expenseTypeId') expenseTypeId: number,
    @Body('incomeTypeId') incomeTypeId: number,
  ) {
    const data = {
      file: file.path,
      propertyId: propertyId,
      expenseTypeId: expenseTypeId,
      incomeTypeId: incomeTypeId,
    };

    await this.service.importCsv(data);
  }
}
