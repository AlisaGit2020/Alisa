import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ExpenseTypeService } from './expense-type.service';
import { ExpenseType } from './entities/expense-type.entity';
import { ExpenseTypeInputDto } from './dtos/expense-type-input.dto';
import { FindManyOptions } from 'typeorm';
import { JwtAuthGuard } from '@alisa-backend/auth/jwt.auth.guard';
import { User } from '@alisa-backend/common/decorators/user.decorator';
import { JWTUser } from '@alisa-backend/auth/types';

@UseGuards(JwtAuthGuard)
@Controller('accounting/expense/type')
export class ExpenseTypeController {
  constructor(private service: ExpenseTypeService) {}

  @Post('/search')
  @HttpCode(200)
  async search(
    @User() user: JWTUser,
    @Body() options: FindManyOptions<ExpenseType>,
  ): Promise<ExpenseType[]> {
    return this.service.search(user, options);
  }

  @Get('/:id')
  async findOne(
    @User() user: JWTUser,
    @Param('id') id: string,
  ): Promise<ExpenseType> {
    const expenseType = await this.service.findOne(user, Number(id));
    if (!expenseType) {
      throw new NotFoundException();
    }
    return expenseType;
  }

  @Post('/')
  async add(
    @User() user: JWTUser,
    @Body() expenseTypeInput: ExpenseTypeInputDto,
  ): Promise<ExpenseType> {
    return this.service.add(user, expenseTypeInput);
  }

  @Put('/:id')
  async update(
    @User() user: JWTUser,
    @Param('id') id: string,
    @Body() ExpenseType: ExpenseTypeInputDto,
  ): Promise<ExpenseType> {
    return this.service.update(user, Number(id), ExpenseType);
  }

  @Delete('/:id')
  async delete(
    @User() user: JWTUser,
    @Param('id') id: number,
  ): Promise<boolean> {
    await this.service.delete(user, Number(id));
    return true;
  }
}
