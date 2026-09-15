import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsModule } from './jobs/jobs.module';
import { Job } from './jobs/entities/job.entity';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('DATABASE_URL');
        if (url) {
          return {
            type: 'postgres' as const,
            url,
            entities: [Job],
            synchronize: false,
            ssl: { rejectUnauthorized: false },
          };
        }
        return {
          type: 'sqlite' as const,
          database: config.get<string>('SQLITE_PATH') || 'data.sqlite',
          entities: [Job],
          synchronize: true,
        };
      },
    }),
    JobsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
