import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RealEstateModule } from './real-estate/real-estate.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config'; //d
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
      rootPath: join(__dirname, '..', '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ConfigModule.forRoot(),
    EventEmitterModule.forRoot(),
    CommonModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      synchronize: true,
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
