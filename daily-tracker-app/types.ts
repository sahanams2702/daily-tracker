export type ActivityType = 'habit' | 'task';
export type RepeatType = 'daily' | 'once';

// One row of "what's on for this date" (activity + that day's completion, if any)
export interface DayActivity {
  id: number;
  title: string;
  description: string | null;
  activity_type: ActivityType;
  repeat_type: RepeatType;
  start_date: string; // YYYY-MM-DD
  is_completed: boolean;
  completed_at: string | null;
}

export interface NewActivity {
  title: string;
  description?: string;
  activity_type: ActivityType;
  repeat_type: RepeatType;
  start_date: string; // YYYY-MM-DD
}