import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserInputDto } from '../people/user/dtos/user-input.dto';
import { UserService } from '../people/user/user.service';
import { User } from '../people/user/entities/user.entity';
import { JWTUser } from './types';
import { FindOptionsWhere } from 'typeorm';
import { Transaction } from '@alisa-backend/accounting/transaction/entities/transaction.entity';

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

  async hasOwnership(
    user: JWTUser,
    propertyId: number | undefined,
  ): Promise<boolean> {
    if (propertyId === undefined) {
      return false;
    }
    return this.userService.hasOwnership(user.id, propertyId);
  }
  addOwnershipFilter(
    user: JWTUser,
    where: FindOptionsWhere<Transaction> | FindOptionsWhere<Transaction>[],
  ): FindOptionsWhere<Transaction> | FindOptionsWhere<Transaction>[] {
    if (Array.isArray(where)) {
      for (const index in where) {
        where[index] = this.addOwnershipFilter(
          user,
          where[index],
        ) as FindOptionsWhere<Transaction>;
      }
    } else {
      if (where === undefined) {
        where = {} as FindOptionsWhere<Transaction>;
      }

      const ownershipFilter = { ownerships: [{ userId: user.id }] };

      if (where.property === undefined) {
        where.property = {
          ...ownershipFilter,
        };
      } else {
        where.property = {
          ...(where.property as object),
          ...ownershipFilter,
        };
      }
    }

    return where;
  }

  private async getUserByEmail(email: string): Promise<User | undefined> {
    const users = await this.userService.search({
      where: { email: email },
    });
    return users.length === 1 ? users[0] : undefined;
  }
}
