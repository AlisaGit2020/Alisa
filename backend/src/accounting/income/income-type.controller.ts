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
import { IncomeTypeService } from './income-type.service';
import { IncomeType } from './entities/income-type.entity';
import { FindManyOptions } from 'typeorm';
import { JwtAuthGuard } from '@alisa-backend/auth/jwt.auth.guard';

@UseGuards(JwtAuthGuard)
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

  @Get('/:id')
  async findOne(@Param('id') id: string): Promise<IncomeType> {
    const incomeType = await this.service.findOne(Number(id));
    if (!incomeType) {
      throw new NotFoundException();
    }
    return incomeType;
  }
}
