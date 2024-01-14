import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { Expense } from './entities/expense.entity';
import { ExpenseInputDto } from './dtos/expense-input.dto';
import { FindManyOptions } from 'typeorm';

@Controller('accounting/expense')
export class ExpenseController {
  constructor(private expenseService: ExpenseService) {}

  @Post('/search')
  @HttpCode(200)
  async search(@Body() options: FindManyOptions<Expense>): Promise<Expense[]> {
    return this.expenseService.search(options);
  }

  @Get('/')
  async findAll(): Promise<Expense[]> {
    return this.expenseService.findAll();
  }

  @Get('/:id')
  async findOne(@Param('id') id: string): Promise<Expense> {
    return this.expenseService.findOne(Number(id));
  }

  @Post('/')
  async add(@Body() ExpenseInput: ExpenseInputDto): Promise<Expense> {
    return this.expenseService.add(ExpenseInput);
  }

  @Put('/:id')
  async update(
    @Param('id') id: string,
    @Body() Expense: ExpenseInputDto,
  ): Promise<Expense> {
    return this.expenseService.update(Number(id), Expense);
  }

  @Delete('/:id')
  async delete(@Param('id') id: number): Promise<boolean> {
    await this.expenseService.delete(id);
    return true;
  }
}
