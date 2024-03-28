import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyStatistics } from '@alisa-backend/real-estate/property/entities/property-statistics.entity';
import { OnEvent } from '@nestjs/event-emitter';
import { Events, BalanceChangedEvent } from '@alisa-backend/common/Events';

@Injectable()
export class PropertyStatisticsService {
  constructor(
    @InjectRepository(PropertyStatistics)
    private repository: Repository<PropertyStatistics>,
  ) {}

  @OnEvent(Events.Balance.Changed)
  async calculateStatistics(event: BalanceChangedEvent): Promise<void> {
    const statistics = new PropertyStatistics();
    statistics.balance = event.newBalance;
    statistics.propertyId = event.propertyId;
    await this.save(statistics);
  }

  private async save(
    statistics: PropertyStatistics,
  ): Promise<PropertyStatistics> {
    const existingStatistics = await this.repository.findOne({
      where: { propertyId: statistics.propertyId },
    });

    if (existingStatistics) {
      existingStatistics.balance = statistics.balance;
      return await this.repository.save(existingStatistics);
    }

    return await this.repository.save(statistics);
  }
}
