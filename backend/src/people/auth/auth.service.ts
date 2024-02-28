import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserInputDto } from '../user/dtos/user-input.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async login(user: UserInputDto) {
    const userEntity = await this.userService.findOne(undefined, {
      where: { email: user.email },
    });

    if (!userEntity) {
      this.userService.add(user);
    }
    const accessToken = this.jwtService.sign(user);

    return {
      access_token: accessToken,
      ...user,
    };
  }
}
