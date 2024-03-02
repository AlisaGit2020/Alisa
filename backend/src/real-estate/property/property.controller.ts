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
import { PropertyService } from './property.service';
import { Property } from './entities/property.entity';
import { PropertyInputDto } from './dtos/property-input.dto';
import { FindManyOptions } from 'typeorm';
import { JwtAuthGuard } from '@alisa-backend/auth/jwt.auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('real-estate/property')
export class PropertyController {
  constructor(private service: PropertyService) {}

  @Post('/search')
  @HttpCode(200)
  async search(
    @Body() options: FindManyOptions<Property>,
  ): Promise<Property[]> {
    return this.service.search(options);
  }

  @Get('/')
  async findAll(): Promise<Property[]> {
    return this.service.findAll();
  }

  @Get('/:id')
  async findOne(@Param('id') id: string): Promise<Property> {
    return this.service.findOne(Number(id));
  }

  @Post('/')
  async add(@Body() propertyInput: PropertyInputDto): Promise<Property> {
    return this.service.add(propertyInput);
  }

  @Put('/:id')
  async update(
    @Param('id') id: string,
    @Body() property: PropertyInputDto,
  ): Promise<Property> {
    return this.service.update(Number(id), property);
  }

  @Delete('/:id')
  async delete(@Param('id') id: number): Promise<boolean> {
    await this.service.delete(id);
    return true;
  }
}
