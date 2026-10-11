import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Activity } from './activities.entity';

@Entity('activity_completions')
@Unique(['activity_id', 'completion_date'])
@Index('idx_activity_completions_date', ['completion_date'])
export class ActivityCompletion {
  @PrimaryGeneratedColumn('identity', { type: 'bigint', generatedIdentity: 'ALWAYS' })
  id: string;

  @Column({ type: 'bigint' })
  activity_id: string;

  @ManyToOne(() => Activity, (a) => a.completions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  completion_date: string;

  @Column({ type: 'boolean', default: false })
  is_completed: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date | null;
}