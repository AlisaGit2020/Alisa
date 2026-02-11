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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import type { Express } from 'express';
import { PropertyService } from './property.service';
import { Property } from './entities/property.entity';
import { PropertyInputDto } from './dtos/property-input.dto';
import { FindManyOptions } from 'typeorm';
import { JwtAuthGuard } from '@alisa-backend/auth/jwt.auth.guard';
import { User } from '@alisa-backend/common/decorators/user.decorator';
import { JWTUser } from '@alisa-backend/auth/types';
import { PropertyStatisticsService } from '@alisa-backend/real-estate/property/property-statistics.service';
import { PropertyStatistics } from '@alisa-backend/real-estate/property/entities/property-statistics.entity';
import { PropertyStatisticsFilterDto } from '@alisa-backend/real-estate/property/dtos/property-statistics-filter.dto';
import { PropertyStatisticsSearchDto } from '@alisa-backend/real-estate/property/dtos/property-statistics-search.dto';
import { PropertyDeleteValidationDto } from './dtos/property-delete-validation.dto';

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

  @Post('/statistics/search')
  @HttpCode(200)
  async statisticsSearch(
    @User() jwtUser: JWTUser,
    @Body() filter: PropertyStatisticsSearchDto,
  ): Promise<PropertyStatistics[]> {
    return this.propertyStatisticsService.searchAll(jwtUser, filter);
  }

  @Get('/:id/can-delete')
  async canDelete(
    @User() user: JWTUser,
    @Param('id') id: string,
  ): Promise<PropertyDeleteValidationDto> {
    const { validation } = await this.service.validateDelete(user, Number(id));
    return validation;
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
    @Body() filter: PropertyStatisticsFilterDto,
  ): Promise<PropertyStatistics[]> {
    filter.propertyId = Number(id);
    return this.propertyStatisticsService.search(jwtUser, filter);
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

  @Post('/:id/photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: function (req, file, cb) {
          const dir = './uploads/properties';

          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          cb(null, dir);
        },
        filename: function (req, file, cb) {
          const sanitized = file.originalname
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .substring(0, 100);
          cb(null, `${Date.now()}-${sanitized}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Only image files allowed'), false);
        }
      },
    }),
  )
  async uploadPhoto(
    @User() user: JWTUser,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Property> {
    return this.service.uploadPhoto(user, Number(id), file);
  }

  @Delete('/:id/photo')
  async deletePhoto(
    @User() user: JWTUser,
    @Param('id') id: string,
  ): Promise<Property> {
    return this.service.deletePhoto(user, Number(id));
  }

  @Post('/statistics/recalculate')
  @HttpCode(200)
  async recalculateStatistics(@User() user: JWTUser) {
    // Get all properties owned by the user
    const properties = await this.service.search(user, { select: ['id'] });
    const propertyIds = properties.map((p) => p.id);

    if (propertyIds.length === 0) {
      return { income: { count: 0, total: 0 }, expense: { count: 0, total: 0 }, deposit: { count: 0, total: 0 }, withdraw: { count: 0, total: 0 } };
    }

    // Recalculate statistics for user's properties only
    return this.propertyStatisticsService.recalculateForProperties(propertyIds);
  }
}
