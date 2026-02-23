import { Module } from '@nestjs/common';
import { PeopleModule } from '@asset-backend/people/people.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';
import { TierModule } from './tier.module';

@Module({
  imports: [PeopleModule, TierModule],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
})
export class AdminModule {}
