import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Ownership } from '@alisa-backend/people/ownership/entities/ownership.entity';
import { ExpenseType } from '@alisa-backend/accounting/expense/entities/expense-type.entity';
import { ExpenseTypeService } from '@alisa-backend/accounting/expense/expense-type.service';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  public id?: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  language?: string;

  @Column({ nullable: true })
  photo?: string;

  @OneToMany(() => Ownership, (ownership) => ownership.user, {
    nullable: true,
  })
  ownerships?: Ownership[];

  @OneToMany(() => ExpenseType, (expenseType) => expenseType.user, {
    nullable: true,
    eager: false,
  })
  expenseTypes?: ExpenseType[];
}
