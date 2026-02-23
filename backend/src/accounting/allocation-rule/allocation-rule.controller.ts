import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@asset-backend/auth/jwt.auth.guard';
import { JWTUser } from '@asset-backend/auth/types';
import { User } from '@asset-backend/common/decorators/user.decorator';
import { AllocationRuleService } from './allocation-rule.service';
import { AllocationRule } from './entities/allocation-rule.entity';
import { AllocationRuleInputDto } from './dtos/allocation-rule-input.dto';
import { AllocationResultDto } from './dtos/allocation-result.dto';
import { ApplyAllocationInputDto } from './dtos/apply-allocation-input.dto';
import { ReorderRulesInputDto } from './dtos/reorder-rules-input.dto';

@UseGuards(JwtAuthGuard)
@Controller('allocation-rules')
export class AllocationRuleController {
  constructor(private service: AllocationRuleService) {}

  @Get('/property/:propertyId')
  async findByProperty(
    @User() user: JWTUser,
    @Param('propertyId') propertyId: string,
  ): Promise<AllocationRule[]> {
    return this.service.findByProperty(user, Number(propertyId));
  }

  @Get('/:id')
  async findOne(
    @User() user: JWTUser,
    @Param('id') id: string,
  ): Promise<AllocationRule> {
    return this.service.findOne(user, Number(id));
  }

  @Post('/')
  async create(
    @User() user: JWTUser,
    @Body() input: AllocationRuleInputDto,
  ): Promise<AllocationRule> {
    return this.service.create(user, input);
  }

  @Post('/apply')
  @HttpCode(200)
  async apply(
    @User() user: JWTUser,
    @Body() input: ApplyAllocationInputDto,
  ): Promise<AllocationResultDto> {
    return this.service.apply(user, input.propertyId, input.transactionIds);
  }

  @Put('/reorder')
  async reorder(
    @User() user: JWTUser,
    @Body() input: ReorderRulesInputDto,
  ): Promise<AllocationRule[]> {
    return this.service.reorder(user, input.propertyId, input.ruleIds);
  }

  @Put('/:id')
  async update(
    @User() user: JWTUser,
    @Param('id') id: string,
    @Body() input: AllocationRuleInputDto,
  ): Promise<AllocationRule> {
    return this.service.update(user, Number(id), input);
  }

  @Delete('/:id')
  @HttpCode(204)
  async delete(
    @User() user: JWTUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.service.delete(user, Number(id));
  }
}
