import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Not, Repository } from 'typeorm';
import { Tier } from './entities/tier.entity';
import { TierInputDto } from './dtos/tier-input.dto';
import { UserService } from '@asset-backend/people/user/user.service';
import { User } from '@asset-backend/people/user/entities/user.entity';

@Injectable()
export class TierService {
  constructor(
    @InjectRepository(Tier)
    private repository: Repository<Tier>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private userService: UserService,
  ) {}

  async findAll(): Promise<Tier[]> {
    return this.repository.find({ order: { sortOrder: 'ASC', id: 'ASC' } });
  }

  async findOne(id: number): Promise<Tier> {
    const tier = await this.repository.findOneBy({ id });
    if (!tier) {
      throw new NotFoundException(`Tier with id ${id} not found`);
    }
    return tier;
  }

  async findDefault(): Promise<Tier | null> {
    return this.repository.findOneBy({ isDefault: true });
  }

  async add(input: TierInputDto): Promise<Tier> {
    if (input.isDefault) {
      await this.clearDefaultFlag();
    }
    const tier = this.repository.create(input);
    return this.repository.save(tier);
  }

  async update(id: number, input: TierInputDto): Promise<Tier> {
    const tier = await this.findOne(id);
    if (input.isDefault) {
      await this.clearDefaultFlag(id);
    }
    // Explicit property mapping to prevent mass assignment vulnerabilities
    if (input.name !== undefined) tier.name = input.name;
    if (input.price !== undefined) tier.price = input.price;
    if (input.maxProperties !== undefined)
      tier.maxProperties = input.maxProperties;
    if (input.sortOrder !== undefined) tier.sortOrder = input.sortOrder;
    if (input.isDefault !== undefined) tier.isDefault = input.isDefault;
    return this.repository.save(tier);
  }

  async delete(id: number): Promise<void> {
    await this.findOne(id);
    const usersWithTier = await this.userService.search({
      where: { tierId: id },
    });
    if (usersWithTier.length > 0) {
      throw new BadRequestException(
        'Cannot delete tier with assigned users',
      );
    }
    await this.repository.delete(id);
  }

  async assignTierToUser(userId: number, tierId: number): Promise<void> {
    await this.findOne(tierId);
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    await this.userRepository.update(userId, { tierId });
  }

  async canCreateProperty(userId: number): Promise<boolean> {
    const user = await this.userService.findOne(userId, {
      relations: ['tier'],
    });
    if (!user || !user.tier) {
      const defaultTier = await this.findDefault();
      if (!defaultTier) {
        return true;
      }
      return this.checkPropertyLimit(userId, defaultTier.maxProperties);
    }
    return this.checkPropertyLimit(userId, user.tier.maxProperties);
  }

  private async checkPropertyLimit(
    userId: number,
    maxProperties: number,
  ): Promise<boolean> {
    if (maxProperties === 0) {
      return true;
    }
    const users = await this.userService.search({
      where: { id: userId },
      relations: { ownerships: true },
    });
    const user = users[0];
    if (!user) {
      return false;
    }
    const propertyCount = user.ownerships?.length ?? 0;
    return propertyCount < maxProperties;
  }

  private async clearDefaultFlag(excludeId?: number): Promise<void> {
    const where: FindOptionsWhere<Tier> = { isDefault: true };
    if (excludeId !== undefined) {
      where.id = Not(excludeId);
    }
    const defaultTiers = await this.repository.find({ where });
    for (const tier of defaultTiers) {
      tier.isDefault = false;
      await this.repository.save(tier);
    }
  }
}
