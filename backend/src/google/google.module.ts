import { Module } from '@nestjs/common';
import { GoogleController } from './google.controller';
import { GoogleService } from './google.service';
import { GmailService } from './gmail.service';

@Module({
  controllers: [GoogleController],
  providers: [GoogleService, GmailService],
})
export class GoogleModule {}
