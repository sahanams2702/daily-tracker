import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ActivityCompletion } from './activities-completion.entity';

export type ActivityType = 'habit' | 'task';
export type RepeatType = 'daily' | 'once';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('identity', { type: 'bigint', generatedIdentity: 'ALWAYS' })
  id: string;

  // owner; nullable only because the column was added to a table that may already have rows
  @Column({ type: 'bigint', nullable: true })
  user_id: string | null;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 20 })
  activity_type: ActivityType;

  @Column({ type: 'varchar', length: 20, default: 'once' })
  repeat_type: RepeatType;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  start_date: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @OneToMany(() => ActivityCompletion, (c) => c.activity)
  completions: ActivityCompletion[];
}