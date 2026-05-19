import { forwardRef, Module } from '@nestjs/common';
import { InvitationController } from './invitation.controller';
import { InvitationService } from './invitation.service';
import { MessageModule } from '../message/message.module';
import { NotificationModule } from '../notification/notification.module';
import { ProjectController } from './project.controller';
import { ProjectPermissionService } from './project-permission.service';
import { ProjectService } from './project.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, NotificationModule, forwardRef(() => MessageModule)],
  controllers: [InvitationController, ProjectController],
  providers: [
    ProjectService,
    ProjectPermissionService,
    InvitationService,
  ],
  exports: [ProjectService, ProjectPermissionService],
})
export class ProjectModule {}
