import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@asset-backend/auth/jwt.auth.guard';
import { User } from '@asset-backend/common/decorators/user.decorator';
import { JWTUser } from '@asset-backend/auth/types';
import { PropertyChargeService } from './property-charge.service';
import { PropertyChargeInputDto, PropertyChargeUpdateDto } from './dtos/property-charge-input.dto';
import { PropertyChargeDto, CurrentChargesDto } from './dtos/property-charge-response.dto';

@Controller('real-estate/property')
@UseGuards(JwtAuthGuard)
export class PropertyChargeController {
  constructor(private readonly service: PropertyChargeService) {}

  @Get(':id/charges')
  async findByProperty(
    @User() user: JWTUser,
    @Param('id', ParseIntPipe) propertyId: number,
  ): Promise<PropertyChargeDto[]> {
    return this.service.findByProperty(user, propertyId);
  }

  @Get(':id/charges/current')
  async getCurrentCharges(
    @User() user: JWTUser,
    @Param('id', ParseIntPipe) propertyId: number,
  ): Promise<CurrentChargesDto> {
    return this.service.getCurrentCharges(user, propertyId);
  }

  @Post(':id/charges')
  async create(
    @User() user: JWTUser,
    @Param('id', ParseIntPipe) propertyId: number,
    @Body() input: PropertyChargeInputDto,
  ): Promise<PropertyChargeDto> {
    input.propertyId = propertyId;
    return this.service.create(user, input);
  }

  @Put(':id/charges/:chargeId')
  async update(
    @User() user: JWTUser,
    @Param('id', ParseIntPipe) propertyId: number,
    @Param('chargeId', ParseIntPipe) chargeId: number,
    @Body() input: PropertyChargeUpdateDto,
  ): Promise<PropertyChargeDto> {
    return this.service.update(user, propertyId, chargeId, input);
  }

  @Delete(':id/charges/:chargeId')
  @HttpCode(200)
  async delete(
    @User() user: JWTUser,
    @Param('id', ParseIntPipe) propertyId: number,
    @Param('chargeId', ParseIntPipe) chargeId: number,
  ): Promise<void> {
    return this.service.delete(user, propertyId, chargeId);
  }
}
