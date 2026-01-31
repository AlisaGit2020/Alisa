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
import { TransactionService } from './transaction.service';
import { Transaction } from './entities/transaction.entity';
import { TransactionStatisticsDto } from './dtos/transaction-statistics.dto';
import { FindManyOptions } from 'typeorm';
import { JwtAuthGuard } from '@alisa-backend/auth/jwt.auth.guard';
import { JWTUser } from '@alisa-backend/auth/types';
import { User } from '@alisa-backend/common/decorators/user.decorator';
import { TransactionInputDto } from '@alisa-backend/accounting/transaction/dtos/transaction-input.dto';
import { TransactionSetTypeInputDto } from '@alisa-backend/accounting/transaction/dtos/transaction-set-type-input.dto';
import { TransactionAcceptInputDto } from '@alisa-backend/accounting/transaction/dtos/transaction-accept-input.dto';
import { TransactionSetCategoryTypeInputDto } from '@alisa-backend/accounting/transaction/dtos/transaction-set-category-type-input.dto';
import { DataSaveResultDto } from '@alisa-backend/common/dtos/data-save-result.dto';
import { SplitLoanPaymentInputDto } from '@alisa-backend/accounting/transaction/dtos/split-loan-payment-input.dto';
import { SplitLoanPaymentBulkInputDto } from '@alisa-backend/accounting/transaction/dtos/split-loan-payment-bulk-input.dto';

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

  @Post('/accept')
  async accept(
    @User() user: JWTUser,
    @Body() input: TransactionAcceptInputDto,
  ): Promise<DataSaveResultDto> {
    return this.service.accept(user, input.ids);
  }

  @Post('/delete')
  async deleteMany(
    @User() user: JWTUser,
    @Body() input: TransactionAcceptInputDto,
  ): Promise<DataSaveResultDto> {
    return this.service.deleteMany(user, input.ids);
  }

  @Post('/type')
  async setType(
    @User() user: JWTUser,
    @Body() input: TransactionSetTypeInputDto,
  ): Promise<DataSaveResultDto> {
    return this.service.setType(user, input.ids, input.type);
  }

  @Post('/category-type')
  async setCategoryType(
    @User() user: JWTUser,
    @Body() input: TransactionSetCategoryTypeInputDto,
  ): Promise<DataSaveResultDto> {
    return this.service.setCategoryType(
      user,
      input.ids,
      input.expenseTypeId,
      input.incomeTypeId,
    );
  }

  @Post('/split-loan-payment')
  async splitLoanPaymentBulk(
    @User() user: JWTUser,
    @Body() input: SplitLoanPaymentBulkInputDto,
  ): Promise<DataSaveResultDto> {
    return this.service.splitLoanPaymentBulk(user, input);
  }

  @Post('/:id/split-loan-payment')
  async splitLoanPayment(
    @User() user: JWTUser,
    @Param('id') id: string,
    @Body() input: SplitLoanPaymentInputDto,
  ): Promise<Transaction> {
    return this.service.splitLoanPayment(user, Number(id), input);
  }

  @Get('/:id')
  async findOne(
    @User() user: JWTUser,
    @Param('id') id: string,
  ): Promise<Transaction> {
    const transaction = await this.service.findOne(user, Number(id));
    if (!transaction) {
      throw new NotFoundException();
    }
    return transaction;
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
