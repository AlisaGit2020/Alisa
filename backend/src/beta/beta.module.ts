import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BetaController } from './beta.controller';
import { BetaService } from './beta.service';
import { BetaSignup } from './entities/beta-signup.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BetaSignup])],
  controllers: [BetaController],
  providers: [BetaService],
  exports: [BetaService],
})
export class BetaModule {}
