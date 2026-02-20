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
import { IncomeTypeService } from './income-type.service';
import { IncomeType } from './entities/income-type.entity';
import { IncomeTypeInputDto } from './dtos/income-type-input.dto';
import { FindManyOptions } from 'typeorm';
import { JwtAuthGuard } from '@alisa-backend/auth/jwt.auth.guard';
import { User } from '@alisa-backend/common/decorators/user.decorator';
import { JWTUser } from '@alisa-backend/auth/types';
import { DeleteValidationDto } from '@alisa-backend/common/dtos/delete-validation.dto';

@UseGuards(JwtAuthGuard)
@Controller('accounting/income/type')
export class IncomeTypeController {
  constructor(private service: IncomeTypeService) {}

  @Post('/search')
  @HttpCode(200)
  async search(
    @User() user: JWTUser,
    @Body() options: FindManyOptions<IncomeType>,
  ): Promise<IncomeType[]> {
    return this.service.search(user, options);
  }

  @Get('/:id/can-delete')
  async canDelete(
    @User() user: JWTUser,
    @Param('id') id: string,
  ): Promise<DeleteValidationDto> {
    const { validation } = await this.service.validateDelete(user, Number(id));
    return validation;
  }

  @Get('/:id')
  async findOne(
    @User() user: JWTUser,
    @Param('id') id: string,
  ): Promise<IncomeType> {
    const incomeType = await this.service.findOne(user, Number(id));
    if (!incomeType) {
      throw new NotFoundException();
    }
    return incomeType;
  }

  @Post('/')
  async add(
    @User() user: JWTUser,
    @Body() incomeTypeInput: IncomeTypeInputDto,
  ): Promise<IncomeType> {
    return this.service.add(user, incomeTypeInput);
  }

  @Put('/:id')
  async update(
    @User() user: JWTUser,
    @Param('id') id: string,
    @Body() IncomeType: IncomeTypeInputDto,
  ): Promise<IncomeType> {
    return this.service.update(user, Number(id), IncomeType);
  }

  @Delete('/:id')
  async delete(
    @User() user: JWTUser,
    @Param('id') id: number,
  ): Promise<boolean> {
    await this.service.delete(user, Number(id));
    return true;
  }
}
