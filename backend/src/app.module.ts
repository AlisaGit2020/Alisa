import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RealEstateModule } from './real-estate/real-estate.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AccountingModule } from './accounting/accounting.module';
import { AdminModule } from './admin/admin.module';
import { GoogleModule } from './google/google.module';
import { ImportModule } from './import/import.module';
import { AuthModule } from './auth/auth.module';
import { FeedbackModule } from './feedback/feedback.module';
import { PeopleModule } from './people/people.module';
import { PricingModule } from './pricing/pricing.module';
import { DefaultsModule } from './defaults/defaults.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ConfigModule.forRoot(),
    EventEmitterModule.forRoot(),
    // Rate limiting configuration - skip in test environment
    ThrottlerModule.forRoot(
      process.env.NODE_ENV === 'test'
        ? [{ name: 'default', ttl: 1000, limit: 10000 }]
        : [
            {
              name: 'short',
              ttl: 1000, // 1 second
              limit: 3, // 3 requests per second
            },
            {
              name: 'medium',
              ttl: 10000, // 10 seconds
              limit: 20, // 20 requests per 10 seconds
            },
            {
              name: 'long',
              ttl: 60000, // 1 minute
              limit: 100, // 100 requests per minute
            },
          ],
    ),
    CommonModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      // Disable synchronize in production to prevent schema changes without migrations
      synchronize: process.env.NODE_ENV !== 'production',
      autoLoadEntities: true,
    }),
    AccountingModule,
    AdminModule,
    AuthModule,
    DefaultsModule,
    FeedbackModule,
    GoogleModule,
    ImportModule,
    PeopleModule,
    PricingModule,
    RealEstateModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
