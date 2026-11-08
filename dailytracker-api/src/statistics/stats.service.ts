import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface DayStat {
  date: string;
  planned: number;
  completed: number;
  rate: number | null; // null when nothing was planned that day
}

export interface ActivityStat {
  id: number;
  title: string;
  activity_type: 'habit' | 'task';
  repeat_type: 'daily' | 'once';
  planned: number;
  completed: number;
  rate: number;
}

const pct = (done: number, planned: number) =>
  planned > 0 ? Math.min(100, Math.round((done / planned) * 100)) : null;

@Injectable()
export class StatsService {
  constructor(private readonly ds: DataSource) {}

  async report(userId: number, from: string, to: string) {
    if (Number.isNaN(Date.parse(from)) || Number.isNaN(Date.parse(to))) {
      throw new BadRequestException('Invalid date');
    }
    if (from > to) throw new BadRequestException('from must be on or before to');
    const span = (Date.parse(to) - Date.parse(from)) / 86_400_000 + 1;
    if (span > 366) throw new BadRequestException('Range too large (max 366 days)');

    const owner = String(userId);

    // One row per calendar day: how many items applied that day, and how many were ticked.
    const dayRows: { date: string; planned: number; completed: number }[] = await this.ds.query(
      `SELECT to_char(g.d::date, 'YYYY-MM-DD') AS date,
              COUNT(a.id)::int AS planned,
              (COUNT(c.id) FILTER (WHERE c.is_completed))::int AS completed
         FROM generate_series($2::timestamp, $3::timestamp, interval '1 day') AS g(d)
         LEFT JOIN activities a
           ON a.user_id = $1
          AND a.is_active = TRUE
          AND ((a.repeat_type = 'daily' AND a.start_date <= g.d::date)
            OR (a.repeat_type = 'once'  AND a.start_date  = g.d::date))
         LEFT JOIN activity_completions c
           ON c.activity_id = a.id AND c.completion_date = g.d::date
        GROUP BY g.d
        ORDER BY g.d`,
      [owner, from, to],
    );

    // One row per activity: how many days it applied in the range vs how many it was completed.
    const actRows: Omit<ActivityStat, 'rate'>[] = await this.ds.query(
      `SELECT * FROM (
         SELECT a.id::int AS id, a.title, a.activity_type, a.repeat_type,
                (CASE
                   WHEN a.repeat_type = 'daily'
                     THEN GREATEST(0, ($3::date - GREATEST(a.start_date, $2::date)) + 1)
                   WHEN a.start_date BETWEEN $2::date AND $3::date THEN 1
                   ELSE 0
                 END)::int AS planned,
                (COUNT(c.id) FILTER (WHERE c.is_completed))::int AS completed
           FROM activities a
           LEFT JOIN activity_completions c
             ON c.activity_id = a.id AND c.completion_date BETWEEN $2::date AND $3::date
          WHERE a.user_id = $1 AND a.is_active = TRUE
          GROUP BY a.id
       ) t
       WHERE t.planned > 0
       ORDER BY t.activity_type, t.title`,
      [owner, from, to],
    );

    const days: DayStat[] = dayRows.map((r) => ({ ...r, rate: pct(r.completed, r.planned) }));
    const activities: ActivityStat[] = actRows.map((r) => ({
      ...r,
      rate: pct(r.completed, r.planned) ?? 0,
    }));
    const planned = days.reduce((s, d) => s + d.planned, 0);
    const completed = days.reduce((s, d) => s + d.completed, 0);

    return { from, to, days, activities, totals: { planned, completed, rate: pct(completed, planned) } };
  }
}