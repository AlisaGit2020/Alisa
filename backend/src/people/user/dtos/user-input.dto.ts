import { IsEmail, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

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

  @IsOptional()
  @IsNumber()
  loanPrincipalExpenseTypeId?: number;

  @IsOptional()
  @IsNumber()
  loanInterestExpenseTypeId?: number;

  @IsOptional()
  @IsNumber()
  loanHandlingFeeExpenseTypeId?: number;
}
