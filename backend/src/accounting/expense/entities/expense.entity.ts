import { Transaction } from '../../transaction/entities/transaction.entity';
import { Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';


@Entity()
export class Expense {
  @PrimaryGeneratedColumn()
  public id: number;

  @OneToOne(() => Transaction, { eager: true, cascade: true })
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;

}
