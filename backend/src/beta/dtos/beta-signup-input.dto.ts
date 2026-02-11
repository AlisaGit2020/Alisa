import { IsEmail, IsNotEmpty } from 'class-validator';

export class BetaSignupInputDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
