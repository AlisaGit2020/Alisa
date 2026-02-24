import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { EtuoviImportService } from './etuovi-import.service';
import { EtuoviFetchInputDto } from './dtos/etuovi-fetch-input.dto';
import { EtuoviPropertyDataDto } from './dtos/etuovi-property-data.dto';
import { JwtAuthGuard } from '@asset-backend/auth/jwt.auth.guard';
import { User } from '@asset-backend/common/decorators/user.decorator';
import { JWTUser } from '@asset-backend/auth/types';
import { Property } from '@asset-backend/real-estate/property/entities/property.entity';

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

  @Post('create-prospect')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createProspectProperty(
    @User() user: JWTUser,
    @Body() input: EtuoviFetchInputDto,
  ): Promise<Property> {
    return this.service.createProspectProperty(user, input.url);
  }
}
