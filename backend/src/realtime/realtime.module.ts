import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MessageModule } from '../message/message.module';
import { ProjectModule } from '../project/project.module';
import { TaskModule } from '../task/task.module';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  imports: [AuthModule, MessageModule, ProjectModule, TaskModule],
  providers: [RealtimeGateway],
})
export class RealtimeModule {}
