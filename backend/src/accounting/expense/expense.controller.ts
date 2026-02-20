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
import { ExpenseService } from './expense.service';
import { Expense } from './entities/expense.entity';
import { ExpenseInputDto } from './dtos/expense-input.dto';
import { FindManyOptions } from 'typeorm';
import { JwtAuthGuard } from '@alisa-backend/auth/jwt.auth.guard';
import { User } from '@alisa-backend/common/decorators/user.decorator';
import { JWTUser } from '@alisa-backend/auth/types';
import { BulkDeleteInputDto } from '@alisa-backend/common/dtos/bulk-delete-input.dto';
import { DataSaveResultDto } from '@alisa-backend/common/dtos/data-save-result.dto';

@UseGuards(JwtAuthGuard)
@Controller('accounting/expense')
export class ExpenseController {
  constructor(private service: ExpenseService) {}

  @Post('/search')
  @HttpCode(200)
  async search(
    @User() user: JWTUser,
    @Body() options: FindManyOptions<Expense>,
  ): Promise<Expense[]> {
    return this.service.search(user, options);
  }

  @Get('/default')
  async getDefault(): Promise<ExpenseInputDto> {
    return this.service.getDefault();
  }

  @Get('/:id')
  async findOne(
    @User() user: JWTUser,
    @Param('id') id: string,
  ): Promise<Expense> {
    const expense = await this.service.findOne(user, Number(id));
    if (!expense) {
      throw new NotFoundException();
    }
    return expense;
  }

  @Post('/')
  async add(
    @User() user: JWTUser,
    @Body() input: ExpenseInputDto,
  ): Promise<Expense> {
    return this.service.add(user, input);
  }

  @Put('/:id')
  async update(
    @User() user: JWTUser,
    @Param('id') id: string,
    @Body() input: ExpenseInputDto,
  ): Promise<Expense> {
    return this.service.update(user, Number(id), input);
  }

  @Delete('/:id')
  async delete(
    @User() user: JWTUser,
    @Param('id') id: number,
  ): Promise<boolean> {
    await this.service.delete(user, id);
    return true;
  }

  @Post('/delete')
  async deleteMany(
    @User() user: JWTUser,
    @Body() input: BulkDeleteInputDto,
  ): Promise<DataSaveResultDto> {
    return this.service.deleteMany(user, input.ids);
  }
}
