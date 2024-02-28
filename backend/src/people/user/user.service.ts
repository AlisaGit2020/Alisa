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
    const user = await this.repository.findOne(options);
    return user;
  }

  async add(input: UserInputDto): Promise<User> {
    const userEntity = new User();

    this.mapData(userEntity, input);

    return await this.repository.save(userEntity);
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

  private mapData(user: User, input: UserInputDto) {
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        user[key] = value;
      }
    });
  }
}
