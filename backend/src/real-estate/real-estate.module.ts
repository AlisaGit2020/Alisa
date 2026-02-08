import { forwardRef, Module } from '@nestjs/common';
import { InvestmentController } from './investment/investment.controller';
import { InvestmentService } from './investment/investment.service';
import { Investment } from './investment/entities/investment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyController } from './property/property.controller';
import { PropertyService } from './property/property.service';
import { Property } from './property/entities/property.entity';
import { Ownership } from '@alisa-backend/people/ownership/entities/ownership.entity';
import { PeopleModule } from '@alisa-backend/people/people.module';
import { AuthModule } from '@alisa-backend/auth/auth.module';
import { PropertyStatistics } from '@alisa-backend/real-estate/property/entities/property-statistics.entity';
import { PropertyStatisticsService } from '@alisa-backend/real-estate/property/property-statistics.service';
import { PropertyStatisticsSchemaService } from '@alisa-backend/real-estate/property/property-statistics-schema.service';
import { AccountingModule } from '@alisa-backend/accounting/accounting.module';
import { TaxController } from './property/tax.controller';
import { TaxService } from './property/tax.service';
import { TierModule } from '@alisa-backend/admin/tier.module';

@Module({
  controllers: [InvestmentController, TaxController, PropertyController],
  providers: [InvestmentService, PropertyService, PropertyStatisticsService, PropertyStatisticsSchemaService, TaxService],
  imports: [
    TypeOrmModule.forFeature([
      Investment,
      Property,
      PropertyStatistics,
      Ownership,
    ]),
    forwardRef(() => AccountingModule),
    AuthModule,
    PeopleModule,
    TierModule,
  ],
  exports: [PropertyService],
})
export class RealEstateModule {}
