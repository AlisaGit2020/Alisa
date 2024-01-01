//TypeOrm entity for transaction table.
import { Column, ColumnOptions, Entity, PrimaryGeneratedColumn, ValueTransformer } from 'typeorm';

class DecimalToNumberTransformer implements ValueTransformer {
  to(value: number): number {
    return value;
  }

  from(value: string): number {
    return parseFloat(value);
  }
}

const columnOptionTwoDecimal: ColumnOptions = {
  type: 'decimal',
  precision: 10,
  scale: 2,
  default: 0,
  transformer: new DecimalToNumberTransformer()
};

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  description: string;

  @Column({ type: 'date' })
  transactionDate: Date;

  @Column({ type: 'date' })
  accountingDate: Date;

  @Column(columnOptionTwoDecimal)
  public amount: number;

  @Column(columnOptionTwoDecimal)
  public quantity: number;

  @Column(columnOptionTwoDecimal)
  public totalAmount: number;
}
