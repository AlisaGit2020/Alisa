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
import { OpImportService } from './op.import.service';

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
            console.log('mkdir', dir);
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
  ) {
    await this.service.importCsv({
      csvFile: file.path,
      propertyId: propertyId,
    });
  }
}
