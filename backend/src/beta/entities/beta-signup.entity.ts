import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type BetaSignupStatus = 'pending' | 'invited' | 'active' | 'rejected';

@Entity()
export class BetaSignup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @CreateDateColumn()
  signupDate: Date;

  @Column({ type: 'varchar', default: 'pending' })
  status: BetaSignupStatus;

  @Column({ type: 'timestamp', nullable: true })
  invitedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
