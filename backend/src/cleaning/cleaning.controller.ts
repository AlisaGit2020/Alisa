import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@asset-backend/auth/jwt.auth.guard';
import { RolesGuard } from '@asset-backend/auth/roles.guard';
import { Roles } from '@asset-backend/auth/roles.decorator';
import { User } from '@asset-backend/common/decorators/user.decorator';
import { JWTUser } from '@asset-backend/auth/types';
import { UserRole } from '@asset-backend/common/types';
import { CleaningService } from './cleaning.service';
import { PropertyCleanerService } from './property-cleaner.service';
import { Cleaning } from './entities/cleaning.entity';
import { PropertyCleaner } from './entities/property-cleaner.entity';
import { CleaningInputDto } from './dtos/cleaning-input.dto';
import { CreateCleanerDto } from './dtos/create-cleaner.dto';
import { UserService } from '@asset-backend/people/user/user.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cleaning')
export class CleaningController {
  constructor(
    private cleaningService: CleaningService,
    private propertyCleanerService: PropertyCleanerService,
    private userService: UserService,
  ) {}

  @Post()
  @Roles(UserRole.CLEANER)
  async addCleaning(
    @User() user: JWTUser,
    @Body() input: CleaningInputDto,
  ): Promise<Cleaning> {
    return this.cleaningService.addCleaning(user, input);
  }

  @Get('my/properties')
  @Roles(UserRole.CLEANER)
  getMyProperties(@User() user: JWTUser) {
    return this.propertyCleanerService.getPropertiesForCleaner(user.id);
  }

  @Get('my')
  @Roles(UserRole.CLEANER)
  async getMyCleaning(@User() user: JWTUser): Promise<Cleaning[]> {
    return this.cleaningService.findByCleanerUser(user);
  }

  @Get('property/:propertyId')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async getByProperty(
    @User() user: JWTUser,
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Query('month', new ParseIntPipe({ optional: true })) month?: number,
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
  ): Promise<Cleaning[]> {
    return this.cleaningService.findByProperty(user, propertyId, month, year);
  }

  @Delete(':id')
  async deleteCleaning(
    @User() user: JWTUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.cleaningService.deleteCleaning(user, id);
  }

  @Get('property/:propertyId/cleaners')
  @Roles(UserRole.ADMIN)
  async getCleaners(
    @User() user: JWTUser,
    @Param('propertyId', ParseIntPipe) propertyId: number,
  ): Promise<PropertyCleaner[]> {
    return this.propertyCleanerService.findByProperty(user, propertyId);
  }

  @Post('property/:propertyId/cleaners')
  @Roles(UserRole.ADMIN)
  async assignCleaner(
    @User() user: JWTUser,
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Body('userId', ParseIntPipe) userId: number,
  ): Promise<PropertyCleaner> {
    return this.propertyCleanerService.assign(user, propertyId, userId);
  }

  @Delete('property/:propertyId/cleaners/:userId')
  @Roles(UserRole.ADMIN)
  async removeCleaner(
    @User() user: JWTUser,
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<void> {
    return this.propertyCleanerService.remove(user, propertyId, userId);
  }

  @Post('cleaners')
  @Roles(UserRole.ADMIN)
  createCleaner(@Body() dto: CreateCleanerDto) {
    return this.userService.createCleaner(dto);
  }

  @Get('cleaners')
  @Roles(UserRole.ADMIN)
  getCleanersList(@User() user: JWTUser) {
    return this.userService.findCleanersForAdmin(user.id);
  }
}
