import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Address {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ nullable: true })
  public street?: string;

  @Column({ nullable: true })
  public city?: string;

  @Column({ nullable: true })
  public postalCode?: string;
}
