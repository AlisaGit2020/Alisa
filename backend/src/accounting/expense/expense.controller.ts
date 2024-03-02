import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
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

@UseGuards(JwtAuthGuard)
@Controller('accounting/expense')
export class ExpenseController {
  constructor(private service: ExpenseService) {}

  @Post('/search')
  @HttpCode(200)
  async search(@Body() options: FindManyOptions<Expense>): Promise<Expense[]> {
    return this.service.search(options);
  }

  @Get('/default')
  async getDefault(): Promise<ExpenseInputDto> {
    return this.service.getDefault();
  }

  @Get('/')
  async findAll(): Promise<Expense[]> {
    return this.service.findAll();
  }

  @Get('/:id')
  async findOne(@Param('id') id: string): Promise<Expense> {
    return this.service.findOne(Number(id));
  }

  @Post('/')
  async add(@Body() ExpenseInput: ExpenseInputDto): Promise<Expense> {
    return this.service.add(ExpenseInput);
  }

  @Put('/:id')
  async update(
    @Param('id') id: string,
    @Body() Expense: ExpenseInputDto,
  ): Promise<Expense> {
    return this.service.update(Number(id), Expense);
  }

  @Delete('/:id')
  async delete(@Param('id') id: number): Promise<boolean> {
    await this.service.delete(id);
    return true;
  }
}
