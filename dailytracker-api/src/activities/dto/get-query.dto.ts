import { Matches } from 'class-validator';
import { DATE_RE } from './create-activity.dto';

export class GetDayQueryDto {
  @Matches(DATE_RE, { message: 'date must be YYYY-MM-DD' })
  date: string;
}