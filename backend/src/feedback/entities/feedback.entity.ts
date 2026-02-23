import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '@asset-backend/people/user/entities/user.entity';

export type FeedbackType = 'bug' | 'feature' | 'general';

@Entity()
export class Feedback {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: false })
  user: User;

  @Column()
  userId: number;

  @Column({ type: 'text' })
  message: string;

  @Column({ nullable: true })
  page?: string;

  @Column({ default: 'general' })
  type: FeedbackType;

  @CreateDateColumn()
  createdAt: Date;
}
