import { Module } from '@nestjs/common';
import { OpImportService } from './op/op-import.service';
import { AccountingModule } from '@alisa-backend/accounting/accounting.module';
import { OpImportController } from './op/op-import.controller';
import { AuthModule } from '@alisa-backend/auth/auth.module';
import { RealEstateModule } from '@alisa-backend/real-estate/real-estate.module';

@Module({
  controllers: [OpImportController],
  providers: [OpImportService],
  imports: [AccountingModule, AuthModule, RealEstateModule],
})
export class ImportModule {}
