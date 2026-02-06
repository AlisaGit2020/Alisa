import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@alisa-backend/auth/jwt.auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { User } from '@alisa-backend/people/user/entities/user.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  findAllUsers(): Promise<User[]> {
    return this.adminService.findAllUsers();
  }
}
