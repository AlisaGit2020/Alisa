// src/database/test-database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';


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
    ],    
  })
export class TestDatabaseModule {}
