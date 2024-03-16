import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { ExpenseType } from './entities/expense-type.entity';
import { ExpenseTypeInputDto } from './dtos/expense-type-input.dto';
import { JWTUser } from '@alisa-backend/auth/types';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { FindOptionsWhereWithUserId } from '@alisa-backend/common/types';

@Injectable()
export class ExpenseTypeService {
  constructor(
    @InjectRepository(ExpenseType)
    private repository: Repository<ExpenseType>,
    private authService: AuthService,
  ) {}

  async findAll(): Promise<ExpenseType[]> {
    return this.repository.find();
  }

  async search(
    user: JWTUser,
    options: FindManyOptions<ExpenseType>,
  ): Promise<ExpenseType[]> {
    options.where = this.authService.addUserFilter(
      user,
      options.where as FindOptionsWhereWithUserId<ExpenseType>,
    );
    return this.repository.find(options);
  }

  async findOne(user: JWTUser, id: number): Promise<ExpenseType> {
    const expenseType = await this.repository.findOne({ where: { id: id } });
    if (!expenseType) {
      return null;
    }
    if (expenseType.userId !== user.id) {
      throw new UnauthorizedException();
    }
    return expenseType;
  }

  async add(user: JWTUser, input: ExpenseTypeInputDto): Promise<ExpenseType> {
    const expenseTypeEntity = new ExpenseType();
    await this.validateInput(user, input);
    this.mapData(user, expenseTypeEntity, input);

    return await this.repository.save(expenseTypeEntity);
  }

  async update(
    user: JWTUser,
    id: number,
    input: ExpenseTypeInputDto,
  ): Promise<ExpenseType> {
    const expenseTypeEntity = await this.getEntityOrThrow(user, id);

    this.mapData(user, expenseTypeEntity, input);

    await this.repository.save(expenseTypeEntity);
    return expenseTypeEntity;
  }

  async delete(user: JWTUser, id: number): Promise<void> {
    await this.getEntityOrThrow(user, id);
    await this.repository.delete(id);
  }

  private mapData(
    user: JWTUser,
    expenseType: ExpenseType,
    input: ExpenseTypeInputDto,
  ) {
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        expenseType[key] = value;
      }
    });
    expenseType.userId = user.id;
  }

  private async validateInput(user: JWTUser, input: ExpenseTypeInputDto) {
    //Check the name is not exist
    const expenseType = await this.repository.exist({
      where: {
        userId: user.id,
        name: input.name,
      },
    });
    if (expenseType) {
      throw new BadRequestException('The name is already exist');
    }
  }

  private async getEntityOrThrow(
    user: JWTUser,
    id: number,
  ): Promise<ExpenseType> {
    const expenseEntityType = await this.findOne(user, id);
    if (!expenseEntityType) {
      throw new NotFoundException();
    }
    if (expenseEntityType.userId !== user.id) {
      throw new UnauthorizedException();
    }
    return expenseEntityType;
  }
}
