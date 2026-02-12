import { Module } from '@nestjs/common';
import { EtuoviImportService } from './etuovi-import.service';
import { EtuoviImportController } from './etuovi-import.controller';

@Module({
  controllers: [EtuoviImportController],
  providers: [EtuoviImportService],
  exports: [EtuoviImportService],
})
export class EtuoviImportModule {}
