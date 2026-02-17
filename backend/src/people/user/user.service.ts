import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { User } from '@alisa-backend/people/user/entities/user.entity';
import { UserInputDto } from '@alisa-backend/people/user/dtos/user-input.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private repository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.repository.find();
  }

  async search(options: FindManyOptions<User>): Promise<User[]> {
    return this.repository.find(options);
  }

  async findOne(id: number, options: FindOneOptions<User> = {}): Promise<User> {
    options.where = { id: id };
    return await this.repository.findOne(options);
  }

  async add(input: UserInputDto): Promise<User> {
    const userEntity = new User();

    this.mapData(userEntity, input);

    return this.repository.save(userEntity);
  }

  async save(input: UserInputDto): Promise<User> {
    if (input.id > 0) {
      return this.update(input.id, input);
    } else {
      return this.add(input);
    }
  }

  async update(id: number, input: UserInputDto): Promise<User> {
    const userEntity = await this.findOne(id);

    this.mapData(userEntity, input);

    await this.repository.save(userEntity);
    return userEntity;
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Set admin status for a user. This method is intentionally separate from
   * the regular update to prevent mass assignment vulnerabilities.
   * Should only be called by admin-level operations.
   */
  async setAdminStatus(userId: number, isAdmin: boolean): Promise<void> {
    await this.repository.update(userId, { isAdmin });
  }

  async hasOwnership(userId: number, propertyId: number): Promise<boolean> {
    const user = await this.findOne(userId, { relations: ['ownerships'] });
    if (!user) {
      return false;
    }
    if (!user.ownerships) {
      return false;
    }
    return user.ownerships.some(
      (ownership) => ownership.propertyId === propertyId,
    );
  }

  private mapData(user: User, input: UserInputDto) {
    // Explicit property mapping to prevent mass assignment vulnerabilities
    if (input.firstName !== undefined) user.firstName = input.firstName;
    if (input.lastName !== undefined) user.lastName = input.lastName;
    if (input.email !== undefined) user.email = input.email;
    if (input.language !== undefined) user.language = input.language;
    if (input.photo !== undefined) user.photo = input.photo;
    if (input.loanPrincipalExpenseTypeId !== undefined)
      user.loanPrincipalExpenseTypeId = input.loanPrincipalExpenseTypeId;
    if (input.loanInterestExpenseTypeId !== undefined)
      user.loanInterestExpenseTypeId = input.loanInterestExpenseTypeId;
    if (input.loanHandlingFeeExpenseTypeId !== undefined)
      user.loanHandlingFeeExpenseTypeId = input.loanHandlingFeeExpenseTypeId;
    if (input.dashboardConfig !== undefined)
      user.dashboardConfig = input.dashboardConfig;
  }
}
