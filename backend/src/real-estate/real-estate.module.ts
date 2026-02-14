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
import { Transaction } from '@alisa-backend/accounting/transaction/entities/transaction.entity';
import { Expense } from '@alisa-backend/accounting/expense/entities/expense.entity';
import { Income } from '@alisa-backend/accounting/income/entities/income.entity';
import { DepreciationAsset } from '@alisa-backend/accounting/depreciation/entities/depreciation-asset.entity';
import { Address } from './address/entities/address.entity';

@Module({
  controllers: [InvestmentController, TaxController, PropertyController],
  providers: [InvestmentService, PropertyService, PropertyStatisticsService, PropertyStatisticsSchemaService, TaxService],
  imports: [
    TypeOrmModule.forFeature([
      Address,
      Investment,
      Property,
      PropertyStatistics,
      Ownership,
      Transaction,
      Expense,
      Income,
      DepreciationAsset,
    ]),
    forwardRef(() => AccountingModule),
    AuthModule,
    PeopleModule,
    TierModule,
  ],
  exports: [PropertyService],
})
export class RealEstateModule {}
