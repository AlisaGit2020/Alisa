import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tier } from './entities/tier.entity';
import { TierService } from './tier.service';
import { TierSeeder } from './tier.seeder';
import { PeopleModule } from '@asset-backend/people/people.module';
import { User } from '@asset-backend/people/user/entities/user.entity';
import { Ownership } from '@asset-backend/people/ownership/entities/ownership.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tier, User, Ownership]), PeopleModule],
  providers: [TierService, TierSeeder],
  exports: [TierService],
})
export class TierModule {}
