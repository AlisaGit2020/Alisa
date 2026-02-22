import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ExpenseTypeService } from './expense-type.service';
import { ExpenseType } from './entities/expense-type.entity';
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

  @Get('/:id')
  async findOne(@Param('id') id: string): Promise<ExpenseType> {
    const expenseType = await this.service.findOne(Number(id));
    if (!expenseType) {
      throw new NotFoundException();
    }
    return expenseType;
  }
}
