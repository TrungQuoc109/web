import { Module } from '@nestjs/common';
import { InvitationController } from './invitation.controller';
import { InvitationService } from './invitation.service';
import { NotificationModule } from '../notification/notification.module';
import { ProjectController } from './project.controller';
import { ProjectPermissionService } from './project-permission.service';
import { ProjectService } from './project.service';
import { ProjectMemberService } from './project-member.service';
import { ProjectActivityService } from './project-activity.service';
import { PrismaModule } from '../prisma/prisma.module';

import { ProjectRoleGuard } from './guards/project-role.guard';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [InvitationController, ProjectController],
  providers: [
    ProjectService,
    ProjectPermissionService,
    ProjectMemberService,
    ProjectActivityService,
    InvitationService,
    ProjectRoleGuard,
  ],
  exports: [
    ProjectService,
    ProjectPermissionService,
    ProjectMemberService,
    ProjectActivityService,
    ProjectRoleGuard,
  ],
})
export class ProjectModule {}
