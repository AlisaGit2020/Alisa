//TypeOrm entity for transaction table.
import { DecimalToNumberTransformer } from 'src/common/transformer/entity.data.transformer';
import { columnOptionTwoDecimal } from 'src/common/typeorm.column.definitions';
import { Column, ColumnOptions, Entity, PrimaryGeneratedColumn } from 'typeorm';


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
