import { Controller, Get } from '@nestjs/common';
import { TierService } from '@alisa-backend/admin/tier.service';
import { Tier } from '@alisa-backend/admin/entities/tier.entity';

@Controller('pricing')
export class PricingController {
  constructor(private readonly tierService: TierService) {}

  @Get('tiers')
  async getTiers(): Promise<Tier[]> {
    return this.tierService.findAll();
  }
}
