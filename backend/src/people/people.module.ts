import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/entities/user.entity';
import { Ownership } from './ownership/entities/ownership.entity';
import { UserService } from './user/user.service';

@Module({
  controllers: [],
  providers: [UserService],
  imports: [TypeOrmModule.forFeature([User, Ownership])],
  exports: [UserService],
})
export class PeopleModule {}
