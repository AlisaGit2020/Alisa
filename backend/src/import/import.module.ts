import { Module } from '@nestjs/common';
import { OpImportService } from './op/op-import.service';
import { AccountingModule } from '@asset-backend/accounting/accounting.module';
import { OpImportController } from './op/op-import.controller';
import { SPankkiImportService } from './s-pankki/s-pankki-import.service';
import { SPankkiImportController } from './s-pankki/s-pankki-import.controller';
import { AuthModule } from '@asset-backend/auth/auth.module';
import { RealEstateModule } from '@asset-backend/real-estate/real-estate.module';
import { EtuoviImportController } from './etuovi/etuovi-import.controller';
import { EtuoviImportService } from './etuovi/etuovi-import.service';

@Module({
  controllers: [OpImportController, SPankkiImportController, EtuoviImportController],
  providers: [OpImportService, SPankkiImportService, EtuoviImportService],
  imports: [AccountingModule, AuthModule, RealEstateModule],
})
export class ImportModule {}
