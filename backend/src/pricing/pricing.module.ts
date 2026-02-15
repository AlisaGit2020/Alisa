import { Module } from '@nestjs/common';
import { PricingController } from './pricing.controller';
import { TierModule } from '@alisa-backend/admin/tier.module';

@Module({
  imports: [TierModule],
  controllers: [PricingController],
})
export class PricingModule {}
