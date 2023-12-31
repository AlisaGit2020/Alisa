//TypeOrm entity for property table.

import { Column, ColumnOptions, Entity, PrimaryGeneratedColumn } from 'typeorm';

const columnOptionTwoDecimal: ColumnOptions = {
  type: 'decimal',
  precision: 10,
  scale: 2,
  default: 0,
};

@Entity()
export class Property {
  @PrimaryGeneratedColumn()
  public id: number;
    
  @Column()
  public name: string;

}
