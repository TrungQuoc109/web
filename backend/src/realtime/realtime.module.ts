import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MessageModule } from '../message/message.module';
import { ProjectModule } from '../project/project.module';
import { TaskModule } from '../task/task.module';
import { CommentModule } from '../comment/comment.module';
import { RealtimeGateway } from './realtime.gateway';
import { RedisModule } from '../redis/redis.module';
import { PresenceService } from './presence.service';

@Module({
  imports: [AuthModule, MessageModule, ProjectModule, TaskModule, RedisModule, CommentModule],
  providers: [RealtimeGateway, PresenceService],
})
export class RealtimeModule {}
