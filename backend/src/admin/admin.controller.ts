import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@asset-backend/auth/jwt.auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { TierService } from './tier.service';
import { User } from '@asset-backend/people/user/entities/user.entity';
import { Tier } from './entities/tier.entity';
import { TierInputDto } from './dtos/tier-input.dto';
import { UserRole } from '@asset-backend/common/types';
import { UserService } from '@asset-backend/people/user/user.service';
import { UserInputDto } from '@asset-backend/people/user/dtos/user-input.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private adminService: AdminService,
    private tierService: TierService,
    private userService: UserService,
  ) {}

  @Get('users')
  findAllUsers(): Promise<User[]> {
    return this.adminService.findAllUsers();
  }

  @Get('tiers')
  findAllTiers(): Promise<Tier[]> {
    return this.tierService.findAll();
  }

  @Get('tiers/:id')
  findOneTier(@Param('id', ParseIntPipe) id: number): Promise<Tier> {
    return this.tierService.findOne(id);
  }

  @Post('tiers')
  addTier(@Body() input: TierInputDto): Promise<Tier> {
    return this.tierService.add(input);
  }

  @Put('tiers/:id')
  updateTier(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: TierInputDto,
  ): Promise<Tier> {
    return this.tierService.update(id, input);
  }

  @Delete('tiers/:id')
  deleteTier(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.tierService.delete(id);
  }

  @Put('users/:id/roles')
  updateUserRoles(
    @Param('id', ParseIntPipe) userId: number,
    @Body('roles') roles: UserRole[],
  ): Promise<void> {
    return this.userService.updateRoles(userId, roles);
  }

  @Post('users')
  async createUser(
    @Body() body: { email: string; firstName: string; lastName: string; roles: UserRole[] },
  ): Promise<User> {
    const user = await this.userService.add({
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
    } as UserInputDto);
    await this.userService.updateRoles(user.id, body.roles);
    return this.userService.findOne(user.id);
  }

  @Put('users/:id')
  async updateUser(
    @Param('id', ParseIntPipe) userId: number,
    @Body() body: { email: string; firstName: string; lastName: string },
  ): Promise<User> {
    return this.userService.update(userId, body as UserInputDto);
  }

  @Delete('users/:id')
  deleteUser(@Param('id', ParseIntPipe) userId: number): Promise<void> {
    return this.userService.delete(userId);
  }

  @Put('users/:id/tier')
  assignTierToUser(
    @Param('id', ParseIntPipe) userId: number,
    @Body('tierId', ParseIntPipe) tierId: number,
  ): Promise<void> {
    return this.tierService.assignTierToUser(userId, tierId);
  }
}
