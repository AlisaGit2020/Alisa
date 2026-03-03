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
import { OikotieImportService } from './oikotie-import.service';
import { OikotieFetchInputDto } from './dtos/oikotie-fetch-input.dto';
import { OikotiePropertyDataDto } from './dtos/oikotie-property-data.dto';
import { JwtAuthGuard } from '@asset-backend/auth/jwt.auth.guard';
import { User } from '@asset-backend/common/decorators/user.decorator';
import { JWTUser } from '@asset-backend/auth/types';
import { Property } from '@asset-backend/real-estate/property/entities/property.entity';

@Controller('import/oikotie')
export class OikotieImportController {
  constructor(private readonly service: OikotieImportService) {}

  @Post('fetch')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async fetchPropertyData(
    @Body() input: OikotieFetchInputDto,
  ): Promise<OikotiePropertyDataDto> {
    return this.service.fetchPropertyData(input.url);
  }

  @Post('create-prospect')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createProspectProperty(
    @User() user: JWTUser,
    @Body() input: OikotieFetchInputDto,
  ): Promise<Property> {
    return this.service.createProspectProperty(user, input.url, input.monthlyRent);
  }
}
