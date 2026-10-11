import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, Repository } from 'typeorm';
// adjust these four paths/file names if yours differ
import { CreateActivityDto, UpdateActivityDto } from '../dto/create-activity.dto';
import { SetCompletionDto } from '../dto/set-completion.dto';
import { ActivityCompletion } from '../entity/activities-completion.entity';
import { Activity } from '../entity/activities.entity';

export interface DayActivity {
  id: number;
  title: string;
  description: string | null;
  activity_type: 'habit' | 'task';
  repeat_type: 'daily' | 'once';
  start_date: string;
  is_completed: boolean;
  completed_at: Date | null;
}

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity) private readonly activities: Repository<Activity>,
    @InjectRepository(ActivityCompletion) private readonly completions: Repository<ActivityCompletion>,
  ) {}

  private toDay(a: Activity, c?: ActivityCompletion): DayActivity {
    return {
      id: Number(a.id),
      title: a.title,
      description: a.description,
      activity_type: a.activity_type,
      repeat_type: a.repeat_type,
      start_date: a.start_date,
      is_completed: c?.is_completed ?? false,
      completed_at: c?.completed_at ?? null,
    };
  }

  /** Every query below is filtered by user_id, so one user can never see or touch another's data. */
  async getDay(userId: number, date: string): Promise<DayActivity[]> {
    const owner = String(userId);
    const list = await this.activities.find({
      where: [
        { user_id: owner, is_active: true, repeat_type: 'daily', start_date: LessThanOrEqual(date) },
        { user_id: owner, is_active: true, repeat_type: 'once', start_date: date },
      ],
      order: { created_at: 'ASC' },
    });
    if (!list.length) return [];

    const done = await this.completions.find({
      where: { completion_date: date, activity_id: In(list.map((a) => a.id)) },
    });
    const byActivity = new Map(done.map((c) => [c.activity_id, c]));
    return list.map((a) => this.toDay(a, byActivity.get(a.id)));
  }

  async create(userId: number, dto: CreateActivityDto): Promise<DayActivity> {
    const entity = this.activities.create({
      user_id: String(userId),
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      activity_type: dto.activity_type,
      repeat_type: dto.repeat_type ?? 'once',
      ...(dto.start_date ? { start_date: dto.start_date } : {}),
    });
    return this.toDay(await this.activities.save(entity));
  }

  async update(userId: number, id: number, dto: UpdateActivityDto): Promise<DayActivity> {
    const activity = await this.findOwned(userId, id);
    Object.assign(activity, dto);
    return this.toDay(await this.activities.save(activity));
  }

  async setCompletion(userId: number, id: number, dto: SetCompletionDto): Promise<void> {
    await this.findOwned(userId, id); // ownership check before touching completions
    await this.completions.upsert(
      {
        activity_id: String(id),
        completion_date: dto.completion_date,
        is_completed: dto.is_completed,
        completed_at: dto.is_completed ? new Date() : null,
      },
      ['activity_id', 'completion_date'],
    );
  }

  async remove(userId: number, id: number): Promise<void> {
    const res = await this.activities.delete({ id: String(id), user_id: String(userId) });
    if (!res.affected) throw new NotFoundException(`Activity ${id} not found`);
  }

  // 404 (not 403) for other people's rows, so ids can't be probed
  private async findOwned(userId: number, id: number): Promise<Activity> {
    const a = await this.activities.findOneBy({ id: String(id), user_id: String(userId) });
    if (!a) throw new NotFoundException(`Activity ${id} not found`);
    return a;
  }
}