import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cleaning } from './entities/cleaning.entity';
import { CleaningInputDto } from './dtos/cleaning-input.dto';
import { PropertyCleanerService } from './property-cleaner.service';
import { AuthService } from '@asset-backend/auth/auth.service';
import { JWTUser } from '@asset-backend/auth/types';

@Injectable()
export class CleaningService {
  constructor(
    @InjectRepository(Cleaning)
    private repository: Repository<Cleaning>,
    private propertyCleanerService: PropertyCleanerService,
    private authService: AuthService,
  ) {}

  async addCleaning(
    user: JWTUser,
    input: CleaningInputDto,
  ): Promise<Cleaning> {
    const isAssigned = await this.propertyCleanerService.isCleanerAssigned(
      user.id,
      input.propertyId,
    );

    if (!isAssigned) {
      throw new UnauthorizedException('Not assigned as cleaner for this property');
    }

    return this.repository.save({
      date: input.date,
      propertyId: input.propertyId,
      userId: user.id,
      percentage: input.percentage,
    });
  }

  async findByProperty(
    user: JWTUser,
    propertyId: number,
    month?: number,
    year?: number,
  ): Promise<Cleaning[]> {
    const hasOwnership = await this.authService.hasOwnership(user, propertyId);
    if (!hasOwnership) {
      throw new UnauthorizedException();
    }

    const query = this.repository
      .createQueryBuilder('cleaning')
      .where('cleaning.propertyId = :propertyId', { propertyId })
      .leftJoinAndSelect('cleaning.user', 'user')
      .orderBy('cleaning.date', 'DESC');

    if (month !== undefined) {
      query.andWhere('EXTRACT(MONTH FROM cleaning.date) = :month', { month });
    }

    if (year !== undefined) {
      query.andWhere('EXTRACT(YEAR FROM cleaning.date) = :year', { year });
    }

    return query.getMany();
  }

  async findByCleanerUser(user: JWTUser): Promise<Cleaning[]> {
    return this.repository.find({
      where: { userId: user.id },
      relations: ['property'],
      order: { date: 'DESC' },
    });
  }

  async deleteCleaning(user: JWTUser, id: number): Promise<void> {
    const cleaning = await this.repository.findOne({ where: { id } });

    if (!cleaning) {
      throw new UnauthorizedException('Cleaning not found');
    }

    // Allow if own cleaning
    if (cleaning.userId === user.id) {
      await this.repository.delete(id);
      return;
    }

    // Allow if admin with ownership of property
    const hasOwnership = await this.authService.hasOwnership(
      user,
      cleaning.propertyId,
    );
    if (hasOwnership) {
      await this.repository.delete(id);
      return;
    }

    throw new UnauthorizedException('Cannot delete this cleaning');
  }
}
