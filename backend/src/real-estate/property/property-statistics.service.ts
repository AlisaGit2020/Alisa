import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOptionsWhere, In, Repository } from 'typeorm';
import { Property } from './entities/property.entity';
import { PropertyInputDto } from './dtos/property-input.dto';
import { JWTUser } from '@alisa-backend/auth/types';
import { OwnershipInputDto } from '@alisa-backend/people/ownership/dtos/ownership-input.dto';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { PropertyStatistics } from '@alisa-backend/real-estate/property/entities/property-statistics.entity';
import { PropertyService } from '@alisa-backend/real-estate/property/property.service';
import { TransactionService } from '@alisa-backend/accounting/transaction/transaction.service';
import { BalanceService } from '@alisa-backend/accounting/transaction/balance.service';

@Injectable()
export class PropertyStatisticsService {
  constructor(
    @InjectRepository(PropertyStatistics)
    private repository: Repository<PropertyStatistics>,
    private balanceService: BalanceService,
  ) {}

  async calculateStatistics(user: JWTUser, propertyId: number): Promise<void> {
    const balance = await this.balanceService.getBalance(user, propertyId);
    const statistics = new PropertyStatistics();
    statistics.balance = balance;
    statistics.propertyId = propertyId;
    await this.repository.save(statistics);
  }
}
