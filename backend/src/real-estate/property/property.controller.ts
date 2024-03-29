import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PropertyService } from './property.service';
import { Property } from './entities/property.entity';
import { PropertyInputDto } from './dtos/property-input.dto';
import { FindManyOptions } from 'typeorm';
import { JwtAuthGuard } from '@alisa-backend/auth/jwt.auth.guard';
import { User } from '@alisa-backend/common/decorators/user.decorator';
import { JWTUser } from '@alisa-backend/auth/types';
import { PropertyStatisticsService } from '@alisa-backend/real-estate/property/property-statistics.service';
import { PropertyStatistics } from '@alisa-backend/real-estate/property/entities/property-statistics.entity';

@UseGuards(JwtAuthGuard)
@Controller('real-estate/property')
export class PropertyController {
  constructor(
    private service: PropertyService,
    private propertyStatisticsService: PropertyStatisticsService,
  ) {}

  @Post('/search')
  @HttpCode(200)
  async search(
    @User() jwtUser: JWTUser,
    @Body() options: FindManyOptions<Property>,
  ): Promise<Property[]> {
    return this.service.search(jwtUser, options);
  }

  @Get('/:id')
  async findOne(
    @User() user: JWTUser,
    @Param('id') id: string,
  ): Promise<Property> {
    const property = await this.service.findOne(user, Number(id));
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    return property;
  }

  @Post('/:id/statistics/search')
  @HttpCode(200)
  async statistics(
    @User() jwtUser: JWTUser,
    @Param('id') id: string,
    @Body() options: FindManyOptions<PropertyStatistics>,
  ): Promise<PropertyStatistics[]> {
    options.where = { propertyId: Number(id), ...options.where };
    return this.propertyStatisticsService.search(jwtUser, options);
  }

  @Post('/')
  async add(
    @User() user: JWTUser,
    @Body() propertyInput: PropertyInputDto,
  ): Promise<Property> {
    return this.service.add(user, propertyInput);
  }

  @Put('/:id')
  async update(
    @User() user: JWTUser,
    @Param('id') id: string,
    @Body() property: PropertyInputDto,
  ): Promise<Property> {
    return this.service.update(user, Number(id), property);
  }

  @Delete('/:id')
  async delete(
    @User() user: JWTUser,
    @Param('id') id: number,
  ): Promise<boolean> {
    await this.service.delete(user, Number(id));
    return true;
  }
}
