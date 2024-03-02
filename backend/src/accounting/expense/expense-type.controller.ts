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
import { ExpenseTypeService } from './expense-type.service';
import { ExpenseType } from './entities/expense-type.entity';
import { ExpenseTypeInputDto } from './dtos/expense-type-input.dto';
import { FindManyOptions } from 'typeorm';
import { JwtAuthGuard } from '@alisa-backend/auth/jwt.auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('accounting/expense/type')
export class ExpenseTypeController {
  constructor(private service: ExpenseTypeService) {}

  @Post('/search')
  @HttpCode(200)
  async search(
    @Body() options: FindManyOptions<ExpenseType>,
  ): Promise<ExpenseType[]> {
    return this.service.search(options);
  }

  @Get('/')
  async findAll(): Promise<ExpenseType[]> {
    return this.service.findAll();
  }

  @Get('/:id')
  async findOne(@Param('id') id: string): Promise<ExpenseType> {
    return this.service.findOne(Number(id));
  }

  @Post('/')
  async add(
    @Body() expenseTypeInput: ExpenseTypeInputDto,
  ): Promise<ExpenseType> {
    return this.service.add(expenseTypeInput);
  }

  @Put('/:id')
  async update(
    @Param('id') id: string,
    @Body() ExpenseType: ExpenseTypeInputDto,
  ): Promise<ExpenseType> {
    return this.service.update(Number(id), ExpenseType);
  }

  @Delete('/:id')
  async delete(@Param('id') id: number): Promise<boolean> {
    await this.service.delete(id);
    return true;
  }
}
