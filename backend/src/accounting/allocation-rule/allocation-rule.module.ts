import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AllocationRule } from './entities/allocation-rule.entity';
import { AllocationRuleController } from './allocation-rule.controller';
import { AllocationRuleService } from './allocation-rule.service';
import { AuthModule } from '@alisa-backend/auth/auth.module';
import { AccountingModule } from '@alisa-backend/accounting/accounting.module';
import { Transaction } from '@alisa-backend/accounting/transaction/entities/transaction.entity';

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
