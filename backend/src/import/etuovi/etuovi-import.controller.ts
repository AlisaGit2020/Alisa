import { Body, Controller, HttpCode, HttpStatus, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { EtuoviImportService } from './etuovi-import.service';
import { EtuoviFetchInputDto } from './dtos/etuovi-fetch-input.dto';
import { EtuoviPropertyDataDto } from './dtos/etuovi-property-data.dto';

@Controller('import/etuovi')
export class EtuoviImportController {
  constructor(private readonly service: EtuoviImportService) {}

  @Post('fetch')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async fetchPropertyData(
    @Body() input: EtuoviFetchInputDto,
  ): Promise<EtuoviPropertyDataDto> {
    return this.service.fetchPropertyData(input.url);
  }
}
