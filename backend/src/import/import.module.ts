import { Module } from '@nestjs/common';
import { OpImportService } from './op/op-import.service';
import { AccountingModule } from '@alisa-backend/accounting/accounting.module';
import { OpImportController } from './op/op-import.controller';

@Module({
  controllers: [OpImportController],
  providers: [OpImportService],
  imports: [AccountingModule],
})
export class ImportModule {}
