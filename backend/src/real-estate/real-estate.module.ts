import { Module } from '@nestjs/common';
import { InvestmentController } from './investment/investment.controller';
import { InvestmentService } from './investment/investment.service';
import { Investment } from './investment/entities/investment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyController } from './property/property.controller';
import { PropertyService } from './property/property.service';
import { Property } from './property/entities/property.entity';

@Module({
  controllers: [InvestmentController, PropertyController],
  providers: [InvestmentService, PropertyService],
  imports: [TypeOrmModule.forFeature([Investment, Property])],
})
export class RealEstateModule {}
