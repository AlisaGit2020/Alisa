import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { IncomeType } from './entities/income-type.entity';
import { Income } from './entities/income.entity';
import { IncomeTypeInputDto } from './dtos/income-type-input.dto';
import { JWTUser } from '@alisa-backend/auth/types';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { FindOptionsWhereWithUserId } from '@alisa-backend/common/types';
import { DeleteValidationDto } from '@alisa-backend/common/dtos/delete-validation.dto';

@Injectable()
export class IncomeTypeService {
  constructor(
    @InjectRepository(IncomeType)
    private repository: Repository<IncomeType>,
    @InjectRepository(Income)
    private incomeRepository: Repository<Income>,
    private authService: AuthService,
  ) {}

  async findAll(): Promise<IncomeType[]> {
    return this.repository.find();
  }

  async search(
    user: JWTUser,
    options: FindManyOptions<IncomeType> = {},
  ): Promise<IncomeType[]> {
    options.where = this.authService.addUserFilter(
      user,
      options.where as FindOptionsWhereWithUserId<IncomeType>,
    );
    return this.repository.find(options);
  }

  async findOne(user: JWTUser, id: number): Promise<IncomeType> {
    const incomeType = await this.repository.findOne({ where: { id: id } });
    if (!incomeType) {
      return null;
    }
    if (incomeType.userId !== user.id) {
      throw new UnauthorizedException();
    }
    return incomeType;
  }

  async add(user: JWTUser, input: IncomeTypeInputDto): Promise<IncomeType> {
    const incomeTypeEntity = new IncomeType();
    await this.validateInput(user, input);
    this.mapData(user, incomeTypeEntity, input);
    this.mapData(user, incomeTypeEntity, input);

    return await this.repository.save(incomeTypeEntity);
  }

  async update(
    user: JWTUser,
    id: number,
    input: IncomeTypeInputDto,
  ): Promise<IncomeType> {
    const incomeTypeEntity = await this.getEntityOrThrow(user, id);

    this.mapData(user, incomeTypeEntity, input);

    await this.repository.save(incomeTypeEntity);
    return incomeTypeEntity;
  }

  async delete(user: JWTUser, id: number): Promise<void> {
    await this.getEntityOrThrow(user, id);
    await this.repository.delete(id);
  }

  async validateDelete(
    user: JWTUser,
    id: number,
  ): Promise<{ validation: DeleteValidationDto; incomeType: IncomeType }> {
    const incomeType = await this.getEntityOrThrow(user, id);

    const incomeCount = await this.incomeRepository.count({
      where: { incomeTypeId: id },
    });

    const dependencies = [];
    if (incomeCount > 0) {
      const samples = await this.incomeRepository.find({
        where: { incomeTypeId: id },
        take: 5,
        order: { id: 'DESC' },
      });
      dependencies.push({
        type: 'income' as const,
        count: incomeCount,
        samples: samples.map((i) => ({ id: i.id, description: i.description })),
      });
    }

    return {
      validation: {
        canDelete: true,
        dependencies,
        message:
          dependencies.length > 0
            ? 'The following related data will be deleted'
            : undefined,
      },
      incomeType,
    };
  }

  private mapData(
    user: JWTUser,
    incomeType: IncomeType,
    input: IncomeTypeInputDto,
  ) {
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        incomeType[key] = value;
      }
    });
    incomeType.userId = user.id;
  }

  private async validateInput(user: JWTUser, input: IncomeTypeInputDto) {
    //Check the name is not exist
    const incomeType = await this.repository.exist({
      where: {
        userId: user.id,
        name: input.name,
      },
    });
    if (incomeType) {
      throw new BadRequestException('The name is already exist');
    }
  }

  private async getEntityOrThrow(
    user: JWTUser,
    id: number,
  ): Promise<IncomeType> {
    const incomeEntityType = await this.findOne(user, id);
    if (!incomeEntityType) {
      throw new NotFoundException();
    }
    if (incomeEntityType.userId !== user.id) {
      throw new UnauthorizedException();
    }
    return incomeEntityType;
  }
}
