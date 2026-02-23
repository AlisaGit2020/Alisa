import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AllocationRule } from './entities/allocation-rule.entity';
import { AllocationRuleController } from './allocation-rule.controller';
import { AllocationRuleService } from './allocation-rule.service';
import { AuthModule } from '@asset-backend/auth/auth.module';
import { AccountingModule } from '@asset-backend/accounting/accounting.module';
import { Transaction } from '@asset-backend/accounting/transaction/entities/transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AllocationRule, Transaction]),
    AuthModule,
    forwardRef(() => AccountingModule),
  ],
  controllers: [AllocationRuleController],
  providers: [AllocationRuleService],
  exports: [AllocationRuleService],
})
export class AllocationRuleModule {}
