import { Module } from '@nestjs/common';
import { NotificationModule } from '../notification/notification.module';
import { ProjectModule } from '../project/project.module';
import { TaskController } from './task.controller';
import { TaskReportController } from './task-report.controller';
import { TaskReportService } from './task-report.service';
import { TaskPermissionService } from './task-permission.service';
import { TaskService } from './task.service';

import { TaskRoleGuard } from './guards/task-role.guard';

@Module({
  imports: [ProjectModule, NotificationModule],
  controllers: [TaskController, TaskReportController],
  providers: [TaskService, TaskPermissionService, TaskReportService, TaskRoleGuard],
  exports: [TaskService, TaskPermissionService, TaskReportService, TaskRoleGuard],
})
export class TaskModule {}
