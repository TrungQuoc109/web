import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MessageModule } from './message/message.module';
import { NotificationModule } from './notification/notification.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectModule } from './project/project.module';
import { RealtimeModule } from './realtime/realtime.module';
import { TaskModule } from './task/task.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    DashboardModule,
    MessageModule,
    NotificationModule,
    ProjectModule,
    RealtimeModule,
    TaskModule,
    UploadsModule,
  ],
})
export class AppModule {}
