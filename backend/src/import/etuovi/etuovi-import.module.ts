import { Module } from '@nestjs/common';
import { EtuoviImportService } from './etuovi-import.service';
import { EtuoviImportController } from './etuovi-import.controller';
import { RealEstateModule } from '@asset-backend/real-estate/real-estate.module';

@Module({
  imports: [RealEstateModule],
  controllers: [EtuoviImportController],
  providers: [EtuoviImportService],
  exports: [EtuoviImportService],
})
export class EtuoviImportModule {}
