
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';


@Entity()
export class ExpenseType {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  isTaxDeductible: boolean;

}
