import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateCleanerDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;
}
