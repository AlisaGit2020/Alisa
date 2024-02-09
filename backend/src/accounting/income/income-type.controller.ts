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
import { IncomeTypeService } from './income-type.service';
import { IncomeType } from './entities/income-type.entity';
import { IncomeTypeInputDto } from './dtos/income-type-input.dto';
import { FindManyOptions } from 'typeorm';

@Controller('accounting/income/type')
export class IncomeTypeController {
  constructor(private service: IncomeTypeService) {}

  @Post('/search')
  @HttpCode(200)
  async search(
    @Body() options: FindManyOptions<IncomeType>,
  ): Promise<IncomeType[]> {
    return this.service.search(options);
  }

  @Get('/')
  async findAll(): Promise<IncomeType[]> {
    return this.service.findAll();
  }

  @Get('/:id')
  async findOne(@Param('id') id: string): Promise<IncomeType> {
    return this.service.findOne(Number(id));
  }

  @Post('/')
  async add(@Body() incomeTypeInput: IncomeTypeInputDto): Promise<IncomeType> {
    return this.service.add(incomeTypeInput);
  }

  @Put('/:id')
  async update(
    @Param('id') id: string,
    @Body() IncomeType: IncomeTypeInputDto,
  ): Promise<IncomeType> {
    return this.service.update(Number(id), IncomeType);
  }

  @Delete('/:id')
  async delete(@Param('id') id: number): Promise<boolean> {
    await this.service.delete(id);
    return true;
  }
}
