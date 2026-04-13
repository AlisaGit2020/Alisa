import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cleaning } from './entities/cleaning.entity';
import { PropertyCleaner } from './entities/property-cleaner.entity';
import { CleaningService } from './cleaning.service';
import { PropertyCleanerService } from './property-cleaner.service';
import { CleaningController } from './cleaning.controller';
import { AuthModule } from '@asset-backend/auth/auth.module';
import { PeopleModule } from '@asset-backend/people/people.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cleaning, PropertyCleaner]),
    AuthModule,
    PeopleModule,
  ],
  controllers: [CleaningController],
  providers: [CleaningService, PropertyCleanerService],
  exports: [CleaningService, PropertyCleanerService],
})
export class CleaningModule {}
