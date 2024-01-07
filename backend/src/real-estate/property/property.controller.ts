import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { PropertyService } from './property.service';
import { Property } from './entities/property.entity';
import { PropertyInputDto } from './dtos/property-input.dto';

@Controller('real-estate/property')
export class PropertyController {
  constructor(private propertyService: PropertyService) { }

  @Get('/')
  async findAll(): Promise<Property[]> {
    return this.propertyService.findAll();
  }

  @Get('/:id')
  async findOne(@Param('id') id: string): Promise<Property> {
    return this.propertyService.findOne(Number(id));
  }

  @Post('/')
  async add(
    @Body() propertyInput: PropertyInputDto,
  ): Promise<Property> {
    return this.propertyService.add(propertyInput);
  }

  @Put('/:id')
  async update(@Param('id') id: string, @Body() property: PropertyInputDto): Promise<Property> {
    return this.propertyService.update(Number(id), property);
  }


  @Delete('/:id')
  async delete(@Param('id') id: number): Promise<boolean> {
    await this.propertyService.delete(id)
    return true
  }

}
