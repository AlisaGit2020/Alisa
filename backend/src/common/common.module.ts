import { Global, Module } from '@nestjs/common';
import { EventTrackerService } from './event-tracker.service';

@Global()
@Module({
  providers: [EventTrackerService],
  exports: [EventTrackerService],
})
export class CommonModule {}
