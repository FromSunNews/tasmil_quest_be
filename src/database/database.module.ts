import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { databaseConfig } from 'config';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule.forFeature(databaseConfig)],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'postgres',
          host: configService.get<string>('database.host'),
          port: configService.get<number>('database.port'),
          username: configService.get<string>('database.username'),
          password: configService.get<string>('database.password'),
          database: configService.get<string>('database.name'),
          autoLoadEntities: true,
          synchronize: false,
          logging: configService.get<boolean>('database.logging'),
          migrationsRun: false,
          ssl: configService.get<any>('database.ssl'),
        };
      },
      dataSourceFactory: async (options) => {
        if (!options) {
          throw new Error('Invalid TypeORM options');
        }
        return new DataSource(options).initialize();
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
