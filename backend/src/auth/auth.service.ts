import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserInputDto } from '../people/user/dtos/user-input.dto';
import { UserService } from '../people/user/user.service';
import { User } from '../people/user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async login(user: UserInputDto) {
    const userEntity = await this.getUserByEmail(user.email);

    if (!userEntity) {
      this.userService.add(user);
    }
    const accessToken = this.jwtService.sign(user);

    return {
      access_token: accessToken,
      ...user,
    };
  }

  async getUserInfo(email: string): Promise<User> {
    return this.getUserByEmail(email);
  }

  private async getUserByEmail(email: string): Promise<User> {
    return this.userService.findOne(undefined, {
      where: { email: email },
    });
  }
}
