import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export class CreateActivityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(['habit', 'task'])
  activity_type: 'habit' | 'task';

  @IsOptional()
  @IsIn(['daily', 'once'])
  repeat_type?: 'daily' | 'once';

  @IsOptional()
  @Matches(DATE_RE, { message: 'start_date must be YYYY-MM-DD' })
  start_date?: string;
}

export class UpdateActivityDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['habit', 'task'])
  activity_type?: 'habit' | 'task';

  @IsOptional()
  @IsIn(['daily', 'once'])
  repeat_type?: 'daily' | 'once';

  @IsOptional()
  @Matches(DATE_RE, { message: 'start_date must be YYYY-MM-DD' })
  start_date?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}