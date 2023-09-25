import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Expense {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    description: string = '';

    @Column('float')
    amount: number = 0;
}
