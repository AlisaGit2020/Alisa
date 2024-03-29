import { IsEmail, IsNotEmpty } from 'class-validator';

export class UserInputDto {
  id?: number;

  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  language?: string;

  photo?: string;
}
