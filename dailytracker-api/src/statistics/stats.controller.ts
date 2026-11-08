import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StatsService } from './stats.service';
import { RangeQueryDto } from './range-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('stats')
export class StatsController {
  constructor(private readonly service: StatsService) {}

  // GET /stats/report?from=2026-10-01&to=2026-10-31
  @Get('report')
  report(@CurrentUser() user: AuthUser, @Query() { from, to }: RangeQueryDto) {
    return this.service.report(user.id, from, to);
  }
}