import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Ownership } from '@alisa-backend/people/ownership/entities/ownership.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  locale?: string;

  @Column({ nullable: true })
  photo?: string;

  @OneToMany(() => Ownership, (ownership) => ownership.user)
  ownerships: Ownership[];
}
