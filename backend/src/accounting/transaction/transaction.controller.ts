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
import { TransactionService } from './transaction.service';
import { Transaction } from './entities/transaction.entity';
import { TransactionStatisticsDto } from './dtos/transaction-statistics.dto';
import { FindManyOptions } from 'typeorm';
import { JwtAuthGuard } from '@alisa-backend/auth/jwt.auth.guard';
import { JWTUser } from '@alisa-backend/auth/types';
import { User } from '@alisa-backend/common/decorators/user.decorator';
import { TransactionInputDto } from '@alisa-backend/accounting/transaction/dtos/transaction-input.dto';

@UseGuards(JwtAuthGuard)
@Controller('accounting/transaction')
export class TransactionController {
  constructor(private service: TransactionService) {}

  @Post('/search')
  @HttpCode(200)
  async search(
    @User() user: JWTUser,
    @Body() options: FindManyOptions<Transaction>,
  ): Promise<Transaction[]> {
    return this.service.search(user, options);
  }

  @Post('/search/statistics')
  @HttpCode(200)
  async statistics(
    @User() user: JWTUser,
    @Body() options: FindManyOptions<Transaction>,
  ): Promise<TransactionStatisticsDto> {
    return this.service.statistics(user, options);
  }

  @Post('/')
  async add(
    @User() user: JWTUser,
    @Body() input: TransactionInputDto,
  ): Promise<Transaction> {
    return this.service.add(user, input);
  }

  @Get('/:id')
  async findOne(
    @User() user: JWTUser,
    @Param('id') id: string,
  ): Promise<Transaction> {
    return this.service.findOne(user, Number(id));
  }

  @Put('/:id')
  async update(
    @User() user: JWTUser,
    @Param('id') id: number,
    @Body() input: TransactionInputDto,
  ): Promise<boolean> {
    await this.service.update(user, id, input);
    return true;
  }

  @Delete('/:id')
  async delete(
    @User() user: JWTUser,
    @Param('id') id: number,
  ): Promise<boolean> {
    await this.service.delete(user, id);
    return true;
  }
}
