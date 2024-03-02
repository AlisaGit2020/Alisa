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
import { IncomeService } from './income.service';
import { Income } from './entities/income.entity';
import { IncomeInputDto } from './dtos/income-input.dto';
import { FindManyOptions } from 'typeorm';
import { JwtAuthGuard } from '@alisa-backend/auth/jwt.auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('accounting/income')
export class IncomeController {
  constructor(private service: IncomeService) {}

  @Post('/search')
  @HttpCode(200)
  async search(@Body() options: FindManyOptions<Income>): Promise<Income[]> {
    return this.service.search(options);
  }

  @Get('/default')
  async getDefault(): Promise<IncomeInputDto> {
    return this.service.getDefault();
  }

  @Get('/')
  async findAll(): Promise<Income[]> {
    return this.service.findAll();
  }

  @Get('/:id')
  async findOne(@Param('id') id: string): Promise<Income> {
    return this.service.findOne(Number(id));
  }

  @Post('/')
  async add(@Body() IncomeInput: IncomeInputDto): Promise<Income> {
    return this.service.add(IncomeInput);
  }

  @Put('/:id')
  async update(
    @Param('id') id: string,
    @Body() Income: IncomeInputDto,
  ): Promise<Income> {
    return this.service.update(Number(id), Income);
  }

  @Delete('/:id')
  async delete(@Param('id') id: number): Promise<boolean> {
    await this.service.delete(id);
    return true;
  }
}
