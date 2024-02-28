import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RealEstateModule } from './real-estate/real-estate.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config'; //d
import { AccountingModule } from './accounting/accounting.module';
import { GoogleModule } from './google/google.module';
import { ImportModule } from './import/import.module';
import { AuthModule } from './people/auth/auth.module';
import { PeopleModule } from './people/people.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
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
    AuthModule,
    GoogleModule,
    ImportModule,
    PeopleModule,
    RealEstateModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
