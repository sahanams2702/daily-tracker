import { IsBoolean, Matches } from 'class-validator';
import { DATE_RE } from './create-activity.dto';

export class SetCompletionDto {
  @Matches(DATE_RE, { message: 'completion_date must be YYYY-MM-DD' })
  completion_date: string;

  @IsBoolean()
  is_completed: boolean;
}