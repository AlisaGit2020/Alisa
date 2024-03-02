import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/entities/user.entity';
import { Ownership } from './ownership/entities/ownership.entity';
import { UserService } from './user/user.service';
import { OwnershipService } from './ownership/ownership.service';

@Module({
  controllers: [],
  providers: [OwnershipService, UserService],
  imports: [TypeOrmModule.forFeature([User, Ownership])],
  exports: [OwnershipService, UserService],
})
export class PeopleModule {}
