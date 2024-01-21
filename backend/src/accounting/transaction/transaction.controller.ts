import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { FindManyOptions } from 'typeorm';
import { TransactionService } from './transaction.service';
import { Transaction } from './entities/transaction.entity';

@Controller('accounting/transaction')
export class TransactionController {
  constructor(private service: TransactionService) {}

  @Post('/search')
  @HttpCode(200)
  async search(
    @Body() options: FindManyOptions<Transaction>,
  ): Promise<Transaction[]> {
    return this.service.search(options);
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
