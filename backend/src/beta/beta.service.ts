import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BetaSignup } from './entities/beta-signup.entity';
import { BetaSignupInputDto } from './dtos/beta-signup-input.dto';

@Injectable()
export class BetaService {
  constructor(
    @InjectRepository(BetaSignup)
    private repository: Repository<BetaSignup>,
  ) {}

  async signup(
    input: BetaSignupInputDto,
  ): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = input.email.toLowerCase().trim();

    const existing = await this.repository.findOneBy({ email: normalizedEmail });
    if (existing) {
      throw new ConflictException('This email is already registered.');
    }

    const signup = this.repository.create({
      email: normalizedEmail,
      status: 'pending',
    });
    await this.repository.save(signup);

    return {
      success: true,
      message: 'Successfully signed up for beta.',
    };
  }

  async findAll(): Promise<BetaSignup[]> {
    return this.repository.find({ order: { signupDate: 'DESC' } });
  }

  async findOne(id: number): Promise<BetaSignup> {
    const signup = await this.repository.findOneBy({ id });
    if (!signup) {
      throw new NotFoundException(`Beta signup with id ${id} not found`);
    }
    return signup;
  }
}
