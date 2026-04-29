import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MessageModule } from './message/message.module';
import { NotificationModule } from './notification/notification.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectModule } from './project/project.module';
import { RealtimeModule } from './realtime/realtime.module';
import { TaskModule } from './task/task.module';
import { UploadsModule } from './uploads/uploads.module';
import { RateLimitGuard } from './shared/guards/rate-limit.guard';

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
  providers: [
    // Applies only to routes annotated with @RateLimit(...)
    { provide: APP_GUARD, useClass: RateLimitGuard },
  ],
})
export class AppModule {}
