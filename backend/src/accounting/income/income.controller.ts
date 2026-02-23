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
import { IncomeService } from './income.service';
import { Income } from './entities/income.entity';
import { IncomeInputDto } from './dtos/income-input.dto';
import { FindManyOptions } from 'typeorm';
import { JwtAuthGuard } from '@asset-backend/auth/jwt.auth.guard';
import { User } from '@asset-backend/common/decorators/user.decorator';
import { JWTUser } from '@asset-backend/auth/types';
import { BulkDeleteInputDto } from '@asset-backend/common/dtos/bulk-delete-input.dto';
import { DataSaveResultDto } from '@asset-backend/common/dtos/data-save-result.dto';

@UseGuards(JwtAuthGuard)
@Controller('accounting/income')
export class IncomeController {
  constructor(private service: IncomeService) {}

  @Post('/search')
  @HttpCode(200)
  async search(
    @User() user: JWTUser,
    @Body() options: FindManyOptions<Income>,
  ): Promise<Income[]> {
    return this.service.search(user, options);
  }

  @Get('/default')
  async getDefault(): Promise<IncomeInputDto> {
    return this.service.getDefault();
  }

  @Get('/:id')
  async findOne(
    @User() user: JWTUser,
    @Param('id') id: string,
  ): Promise<Income> {
    const income = await this.service.findOne(user, Number(id));
    if (!income) {
      throw new NotFoundException();
    }
    return income;
  }

  @Post('/')
  async add(
    @User() user: JWTUser,
    @Body() input: IncomeInputDto,
  ): Promise<Income> {
    return this.service.add(user, input);
  }

  @Put('/:id')
  async update(
    @User() user: JWTUser,
    @Param('id') id: string,
    @Body() input: IncomeInputDto,
  ): Promise<Income> {
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
