import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ExpenseTypeDefault {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nameFi: string;

  @Column()
  nameEn: string;

  @Column({ nullable: true })
  nameSv: string;

  @Column()
  isTaxDeductible: boolean;

  @Column({ default: false })
  isCapitalImprovement: boolean;

  @Column({ nullable: true })
  loanSettingKey: string;
}
