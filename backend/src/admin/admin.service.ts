import { Injectable } from '@nestjs/common';
import { UserService } from '@asset-backend/people/user/user.service';
import { User } from '@asset-backend/people/user/entities/user.entity';

@Injectable()
export class AdminService {
  constructor(private userService: UserService) {}

  async findAllUsers(): Promise<User[]> {
    return this.userService.search({
      relations: { tier: true },
    });
  }
}
