import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyCleaner } from './entities/property-cleaner.entity';
import { AuthService } from '@asset-backend/auth/auth.service';
import { JWTUser } from '@asset-backend/auth/types';

@Injectable()
export class PropertyCleanerService {
  constructor(
    @InjectRepository(PropertyCleaner)
    private repository: Repository<PropertyCleaner>,
    private authService: AuthService,
  ) {}

  async findByProperty(
    user: JWTUser,
    propertyId: number,
  ): Promise<PropertyCleaner[]> {
    const hasOwnership = await this.authService.hasOwnership(user, propertyId);
    if (!hasOwnership) {
      throw new UnauthorizedException();
    }

    return this.repository.find({
      where: { propertyId },
      relations: ['user'],
    });
  }

  async assign(
    user: JWTUser,
    propertyId: number,
    userId: number,
  ): Promise<PropertyCleaner> {
    const hasOwnership = await this.authService.hasOwnership(user, propertyId);
    if (!hasOwnership) {
      throw new UnauthorizedException();
    }

    return this.repository.save({ propertyId, userId });
  }

  async remove(user: JWTUser, propertyId: number, userId: number): Promise<void> {
    const hasOwnership = await this.authService.hasOwnership(user, propertyId);
    if (!hasOwnership) {
      throw new UnauthorizedException();
    }

    await this.repository.delete({ propertyId, userId });
  }

  async getPropertiesForCleaner(userId: number): Promise<PropertyCleaner[]> {
    return this.repository.find({
      where: { userId },
      relations: ['property'],
    });
  }

  async isCleanerAssigned(userId: number, propertyId: number): Promise<boolean> {
    const count = await this.repository.count({
      where: { userId, propertyId },
    });
    return count > 0;
  }
}
