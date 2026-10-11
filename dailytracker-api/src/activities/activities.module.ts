import { Module } from '@nestjs/common';
import { ActivitiesController } from './controller/activities.controller';
import { ActivitiesService } from './service/activities.service';
import { Activity } from './entity/activities.entity';
import { ActivityCompletion } from './entity/activities-completion.entity';
import { TypeOrmModule } from '@nestjs/typeorm';


@Module({
  imports: [TypeOrmModule.forFeature([Activity, ActivityCompletion])],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
})
export class ActivitiesModule {}