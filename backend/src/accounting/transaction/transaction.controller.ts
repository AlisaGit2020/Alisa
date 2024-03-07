import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { Transaction } from './entities/transaction.entity';
import { TransactionStatisticsDto } from './dtos/transaction-statistics.dto';
import { FindManyOptions } from 'typeorm';
import { JwtAuthGuard } from '@alisa-backend/auth/jwt.auth.guard';
import { JWTUser } from '@alisa-backend/auth/types';
import { User } from '@alisa-backend/common/decorators/user.decorator';

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
    @Body() options: FindManyOptions<Transaction>,
  ): Promise<TransactionStatisticsDto> {
    return this.service.statistics(options);
  }

  @Get('/:id')
  async findOne(@Param('id') id: string): Promise<Transaction> {
    return this.service.findOne(Number(id));
  }

  @Delete('/:id')
  async delete(@Param('id') id: number): Promise<boolean> {
    await this.service.delete(id);
    return true;
  }
}
