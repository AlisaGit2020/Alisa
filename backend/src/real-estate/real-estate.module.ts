import { Module } from '@nestjs/common';
import { InvestmentController } from './investment/investment.controller';
import { InvestmentService } from './investment/investment.service';
import { Investment } from './investment/entities/investment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [InvestmentController],
  providers: [InvestmentService],
  imports: [TypeOrmModule.forFeature([Investment])],
})
export class RealEstateModule {}
