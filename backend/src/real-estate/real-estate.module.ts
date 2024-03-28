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
import { AccountingModule } from '@alisa-backend/accounting/accounting.module';

@Module({
  controllers: [InvestmentController, PropertyController],
  providers: [InvestmentService, PropertyService, PropertyStatisticsService],
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
  ],
  exports: [PropertyService],
})
export class RealEstateModule {}
