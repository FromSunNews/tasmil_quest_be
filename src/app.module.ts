import { join } from 'path';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { redisStore } from 'cache-manager-ioredis-yet';
import {
  appConfig,
  authConfig,
  databaseConfig,
  redisConfig,
} from './config';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './infra/redis/redis.module';
import { MockRedisModule } from './infra/redis/mock-redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { UserTasksModule } from './modules/user-tasks/user-tasks.module';
import { ClaimsModule } from './modules/claims/claims.module';
import { AdminModule } from './modules/admin/admin.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SocialAccountsModule } from './modules/social-accounts/social-accounts.module';
import { SharedModule } from './shared/shared.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

const redisFeatureModule =
process.env.MOCK_REDIS === 'true' ? MockRedisModule : RedisModule;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '..', '.env'),
      load: [appConfig, databaseConfig, redisConfig, authConfig],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        if (process.env.MOCK_REDIS === 'true') {
          return {
            ttl: 0,
          };
        }
        const redisConfig = configService.get<any>('redis');
        const redisHost = redisConfig?.host || process.env.REDIS_HOST || 'localhost';
        const redisPort = redisConfig?.port || parseInt(process.env.REDIS_PORT || '6379', 10);
        const redisPassword = redisConfig?.password || process.env.REDIS_PASSWORD;

        console.log('[CacheModule] Connecting to Redis:', { host: redisHost, port: redisPort, tls: redisConfig?.tls ? true : false });

        return {
          store: await redisStore({
            socket: {
              host: redisHost,
              port: redisPort,
              tls: redisConfig?.tls ? true : (process.env.REDIS_TLS === 'true' ? {} : undefined),
            },
            password: redisPassword,
            ttl: redisConfig?.ttl || 60,
            retryStrategy: () => null, // disable retry
          } as any),
        };
      },
    }),
    DatabaseModule,
    redisFeatureModule,
    AuthModule,
    UsersModule,
    CampaignsModule,
    TasksModule,
    UserTasksModule,
    ClaimsModule,
    AdminModule,
    AnalyticsModule,
    NotificationsModule,
    SocialAccountsModule,
    SharedModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
  