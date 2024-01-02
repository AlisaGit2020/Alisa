import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ExpenseTypeService } from './expense-type.service';
import { ExpenseType } from './entities/expense-type.entity';
import { ExpenseTypeInputDto } from './dtos/expense-type-input.dto';

@Controller('accounting/expense/type')
export class ExpenseTypeController {
  constructor(private expenseTypeService: ExpenseTypeService) { }

  @Get('/')
  async findAll(): Promise<ExpenseType[]> {
    return this.expenseTypeService.findAll();
  }

  @Get('/:id')
  async findOne(@Param('id') id: string): Promise<ExpenseType> {
    return this.expenseTypeService.findOne(Number(id));
  }

  @Post('/')
  async add(
    @Body() expenseTypeInput: ExpenseTypeInputDto,
  ): Promise<ExpenseType> {
    return this.expenseTypeService.add(expenseTypeInput);
  }

  @Put('/:id')
  async update(@Param('id') id: string, @Body() ExpenseType: ExpenseTypeInputDto): Promise<ExpenseType> {
    return this.expenseTypeService.update(Number(id), ExpenseType);
  }

  @Delete('/:id')
  async delete(@Param('id') id: number): Promise<boolean> {
    await this.expenseTypeService.delete(id)
    return true
  }

}
