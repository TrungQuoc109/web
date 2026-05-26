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

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [InvitationController, ProjectController],
  providers: [
    ProjectService,
    ProjectPermissionService,
    ProjectMemberService,
    ProjectActivityService,
    InvitationService,
  ],
  exports: [
    ProjectService,
    ProjectPermissionService,
    ProjectMemberService,
    ProjectActivityService,
  ],
})
export class ProjectModule {}
