import { Module } from '@nestjs/common';
import { OpImportService } from './op/op-import.service';
import { AccountingModule } from '@alisa-backend/accounting/accounting.module';
import { OpImportController } from './op/op-import.controller';
import { SPankkiImportService } from './s-pankki/s-pankki-import.service';
import { SPankkiImportController } from './s-pankki/s-pankki-import.controller';
import { AuthModule } from '@alisa-backend/auth/auth.module';
import { RealEstateModule } from '@alisa-backend/real-estate/real-estate.module';
import { EtuoviImportModule } from './etuovi/etuovi-import.module';

@Module({
  controllers: [OpImportController, SPankkiImportController],
  providers: [OpImportService, SPankkiImportService],
  imports: [AccountingModule, AuthModule, RealEstateModule, EtuoviImportModule],
})
export class ImportModule {}
