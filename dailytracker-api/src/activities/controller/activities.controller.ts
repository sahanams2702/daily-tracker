import {
  Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Put, Query, UseGuards,
} from '@nestjs/common';

// adjust these paths/file names if yours differ
import { CreateActivityDto, UpdateActivityDto } from '../dto/create-activity.dto';

import { SetCompletionDto } from '../dto/set-completion.dto';
import { ActivitiesService } from '../service/activities.service';
import { GetDayQueryDto } from '../dto/get-query.dto';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { AuthUser } from '../../auth/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard) // every route here requires a valid token
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly service: ActivitiesService) {}

  @Get('day')
  getDay(@CurrentUser() user: AuthUser, @Query() { date }: GetDayQueryDto) {
    return this.service.getDay(user.id, date);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateActivityDto) {
    return this.service.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Put(':id/completion')
  @HttpCode(204)
  setCompletion(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetCompletionDto,
  ) {
    return this.service.setCompletion(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(user.id, id);
  }
}