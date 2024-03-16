import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { TransactionInputDto } from './dtos/transaction-input.dto';
import { Transaction } from './entities/transaction.entity';
import { JWTUser } from '@alisa-backend/auth/types';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { PropertyService } from '@alisa-backend/real-estate/property/property.service';

@Injectable()
export class BalanceService {
  constructor(
    @InjectRepository(Transaction)
    private repository: Repository<Transaction>,

    private authService: AuthService,
    private propertyService: PropertyService,
  ) {}

  async getBalance(user: JWTUser, propertyId: number): Promise<number> {
    const property = await this.propertyService.findOne(user, propertyId);
    if (!property) {
      throw new NotFoundException();
    }

    if (!(await this.authService.hasOwnership(user, propertyId))) {
      throw new UnauthorizedException();
    }

    const transactions = await this.repository.find({
      where: { propertyId },
      order: { id: 'DESC' },
      take: 1,
    });

    if (transactions.length === 0) {
      return 0;
    }

    return transactions[0].balance;
  }

  async handleTransactionAdd(
    user: JWTUser,
    transaction: Transaction,
  ): Promise<void> {
    const balance = await this.getBalance(user, transaction.propertyId);
    transaction.balance = balance + transaction.amount;
  }

  async handleTransactionUpdate(
    transaction: Transaction,
    input: TransactionInputDto,
  ): Promise<void> {
    if (input.amount === transaction.amount) {
      return;
    }
    //Get all transaction ids before the current transaction
    const previousIds = await this.repository.find({
      where: {
        propertyId: transaction.propertyId,
        id: LessThan(transaction.id),
      },
      order: { id: 'DESC' },
      select: ['id'],
      take: 1,
    });
    const previousId = previousIds[0]?.id ?? 0;

    if (previousId === 0) {
      transaction.balance = input.amount;
      return;
    }
    //Get previous row balance
    const previousBalance = await this.repository.findOne({
      where: { id: previousId },
      select: ['balance'],
    });
    //Calculate the new balance, previous balance new amount
    transaction.balance = previousBalance.balance + input.amount;
  }

  async recalculateBalancesAfter(transaction: Transaction) {
    const transactions = await this.repository.find({
      where: {
        propertyId: transaction.propertyId,
        id: MoreThan(transaction.id),
      },
      order: { id: 'ASC' },
    });

    if (transactions.length === 0) {
      return;
    }

    let balance = transaction.balance;

    for (const t of transactions) {
      balance = t.amount + balance;
      t.balance = balance;
      await this.repository.save(t);
    }
  }

  async recalculateBalancesAfterDelete(transaction: Transaction) {
    const transactions = await this.repository.find({
      where: {
        propertyId: transaction.propertyId,
        id: MoreThan(transaction.id),
      },
      order: { id: 'ASC' },
      take: 1,
    });
    const nextTransaction = transactions[0];

    if (!nextTransaction) {
      return;
    }
    //Fix next transaction balance
    nextTransaction.balance = nextTransaction.balance - transaction.amount;
    await this.repository.save(nextTransaction);

    await this.recalculateBalancesAfter(nextTransaction);
  }
}
