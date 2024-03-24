import { Module } from '@nestjs/common';
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

@Module({
  controllers: [InvestmentController, PropertyController],
  providers: [InvestmentService, PropertyService],
  imports: [
    TypeOrmModule.forFeature([
      Investment,
      Property,
      PropertyStatistics,
      Ownership,
    ]),
    AuthModule,
    PeopleModule,
  ],
  exports: [PropertyService],
})
export class RealEstateModule {}
