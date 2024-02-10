import { Module } from '@nestjs/common';
import { OpImportService } from './op/op.import.service';
import { AccountingModule } from '@alisa-backend/accounting/accounting.module';

@Module({
  controllers: [],
  providers: [OpImportService],
  imports: [AccountingModule],
})
export class ImportModule {}
