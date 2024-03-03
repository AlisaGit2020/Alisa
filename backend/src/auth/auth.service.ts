import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserInputDto } from '../people/user/dtos/user-input.dto';
import { UserService } from '../people/user/user.service';
import { User } from '../people/user/entities/user.entity';
import { JWTUser } from './types';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async login(user: UserInputDto) {
    let userEntity = await this.getUserByEmail(user.email);

    if (userEntity) {
      await this.userService.update(userEntity.id, user);
    } else {
      await this.userService.add(user);
      userEntity = await this.getUserByEmail(user.email);
    }

    const users = await this.userService.search({
      where: { id: userEntity.id },
      relations: {
        ownerships: true,
      },
    });

    userEntity = users[0];

    const jtwUser: JWTUser = {
      id: userEntity.id,
      firstName: userEntity.firstName,
      lastName: userEntity.lastName,
      email: userEntity.email,
      language: userEntity.language,
      ownershipInProperties:
        userEntity?.ownerships?.map((ownership) => ownership.propertyId) ?? [],
    };

    return this.jwtService.sign(jtwUser);
  }

  async getUserInfo(email: string): Promise<User> {
    return this.getUserByEmail(email);
  }

  private async getUserByEmail(email: string): Promise<User | undefined> {
    const users = await this.userService.search({
      where: { email: email },
    });
    return users.length === 1 ? users[0] : undefined;
  }
}
