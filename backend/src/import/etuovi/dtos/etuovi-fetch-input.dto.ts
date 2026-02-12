import { IsNotEmpty, IsUrl, Matches } from 'class-validator';

export class EtuoviFetchInputDto {
  @IsNotEmpty()
  @IsUrl()
  @Matches(/^https?:\/\/(www\.)?etuovi\.com\/kohde\//, {
    message: 'URL must be a valid etuovi.com property listing URL',
  })
  url: string;
}
