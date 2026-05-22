import { Module } from '@nestjs/common';
import { NotificationModule } from '../notification/notification.module';
import { ProjectModule } from '../project/project.module';
import { TaskModule } from '../task/task.module';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';

@Module({
  imports: [
    NotificationModule,
    ProjectModule,
    TaskModule,
  ],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
