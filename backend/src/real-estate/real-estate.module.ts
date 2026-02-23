import { forwardRef, Module } from '@nestjs/common';
import { InvestmentController } from './investment/investment.controller';
import { InvestmentService } from './investment/investment.service';
import { Investment } from './investment/entities/investment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyController } from './property/property.controller';
import { PropertyService } from './property/property.service';
import { Property } from './property/entities/property.entity';
import { Ownership } from '@asset-backend/people/ownership/entities/ownership.entity';
import { PeopleModule } from '@asset-backend/people/people.module';
import { AuthModule } from '@asset-backend/auth/auth.module';
import { PropertyStatistics } from '@asset-backend/real-estate/property/entities/property-statistics.entity';
import { PropertyStatisticsService } from '@asset-backend/real-estate/property/property-statistics.service';
import { PropertyStatisticsSchemaService } from '@asset-backend/real-estate/property/property-statistics-schema.service';
import { AirbnbStatisticsService } from '@asset-backend/real-estate/property/airbnb-statistics.service';
import { AccountingModule } from '@asset-backend/accounting/accounting.module';
import { TaxController } from './property/tax.controller';
import { TaxService } from './property/tax.service';
import { TierModule } from '@asset-backend/admin/tier.module';
import { Transaction } from '@asset-backend/accounting/transaction/entities/transaction.entity';
import { Expense } from '@asset-backend/accounting/expense/entities/expense.entity';
import { Income } from '@asset-backend/accounting/income/entities/income.entity';
import { DepreciationAsset } from '@asset-backend/accounting/depreciation/entities/depreciation-asset.entity';
import { Address } from './address/entities/address.entity';

@Module({
  controllers: [InvestmentController, TaxController, PropertyController],
  providers: [InvestmentService, PropertyService, PropertyStatisticsService, PropertyStatisticsSchemaService, AirbnbStatisticsService, TaxService],
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
