import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class IncomeTypeDefault {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nameFi: string;

  @Column()
  nameEn: string;

  @Column({ default: false })
  isTaxable: boolean;
}
