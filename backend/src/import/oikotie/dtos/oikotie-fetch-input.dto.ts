import { IsNotEmpty, IsNumber, IsOptional, IsUrl, Matches } from 'class-validator';

export class OikotieFetchInputDto {
  @IsNotEmpty()
  @IsUrl()
  @Matches(/^https?:\/\/(www\.)?asunnot\.oikotie\.fi\/myytavat-asunnot\//, {
    message: 'URL must be a valid Oikotie property listing URL',
  })
  url: string;

  @IsOptional()
  @IsNumber()
  monthlyRent?: number;
}
