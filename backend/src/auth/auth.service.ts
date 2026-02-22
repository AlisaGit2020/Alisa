import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserInputDto } from '../people/user/dtos/user-input.dto';
import { UserService } from '../people/user/user.service';
import { User } from '../people/user/entities/user.entity';
import { JWTUser } from './types';
import { FindOptionsWhere } from 'typeorm';
import { Transaction } from '@alisa-backend/accounting/transaction/entities/transaction.entity';
import { FindOptionsWhereWithUserId } from '@alisa-backend/common/types';
import { UserSettingsInputDto } from './dtos/user-settings-input.dto';
import { TierService } from '@alisa-backend/admin/tier.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private tierService: TierService,
  ) {}

  async login(user: UserInputDto) {
    let userEntity = await this.getUserByEmail(user.email);

    if (userEntity) {
      // For existing users, exclude language to preserve their preference
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { language, ...userWithoutLanguage } = user;
      await this.userService.update(userEntity.id, userWithoutLanguage);
    } else {
      await this.userService.add(user);
      userEntity = await this.getUserByEmail(user.email);

      const defaultTier = await this.tierService.findDefault();
      if (defaultTier) {
        await this.userService.update(userEntity.id, {
          ...user,
          tierId: defaultTier.id,
        } as UserInputDto & { tierId: number });
      }
    }

    const users = await this.userService.search({
      where: { id: userEntity.id },
      relations: {
        ownerships: true,
        tier: true,
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
      isAdmin: userEntity.isAdmin ?? false,
      tierId: userEntity.tierId,
      tierName: userEntity.tier?.name,
      tierMaxProperties: userEntity.tier?.maxProperties,
    };

    return this.jwtService.sign(jtwUser);
  }

  async getUserInfo(email: string): Promise<User> {
    return this.getUserByEmail(email);
  }

  async updateUserSettings(
    userId: number,
    input: UserSettingsInputDto,
  ): Promise<User> {
    const user = await this.userService.findOne(userId);
    if (!user) {
      return null;
    }

    // Update only settings fields
    if (input.dashboardConfig !== undefined) {
      user.dashboardConfig = input.dashboardConfig;
    }
    if (input.language !== undefined) {
      user.language = input.language;
    }

    return await this.userService.save(user as UserInputDto);
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

  addUserFilter<T>(
    user: JWTUser,
    where: FindOptionsWhereWithUserId<T> | FindOptionsWhereWithUserId<T>[],
  ): FindOptionsWhereWithUserId<T> | FindOptionsWhereWithUserId<T>[] {
    if (Array.isArray(where)) {
      for (const index in where) {
        where[index] = this.addUserFilter(
          user,
          where[index],
        ) as FindOptionsWhereWithUserId<T>;
      }
    } else {
      if (where === undefined) {
        where = {} as FindOptionsWhereWithUserId<T>;
      }

      where.userId = user.id;
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
