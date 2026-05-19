import { forwardRef, Module } from '@nestjs/common';
import { MessageModule } from '../message/message.module';
import { NotificationModule } from '../notification/notification.module';
import { ProjectModule } from '../project/project.module';
import { TaskController } from './task.controller';
import { TaskReportController } from './task-report.controller';
import { TaskReportService } from './task-report.service';
import { TaskPermissionService } from './task-permission.service';
import { TaskService } from './task.service';

@Module({
  imports: [ProjectModule, NotificationModule, forwardRef(() => MessageModule)],
  controllers: [TaskController, TaskReportController],
  providers: [TaskService, TaskPermissionService, TaskReportService],
  exports: [TaskService, TaskPermissionService, TaskReportService],
})
export class TaskModule {}
