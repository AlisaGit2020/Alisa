import {
  Injectable,
  BadRequestException,
  ServiceUnavailableException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { OikotiePropertyDataDto } from './dtos/oikotie-property-data.dto';
import { PropertyInputDto } from '@asset-backend/real-estate/property/dtos/property-input.dto';
import { AddressInputDto } from '@asset-backend/real-estate/address/dtos/address-input.dto';
import {
  PropertyExternalSource,
  PropertyStatus,
  PropertyType,
} from '@asset-backend/common/types';
import { PropertyService } from '@asset-backend/real-estate/property/property.service';
import { JWTUser } from '@asset-backend/auth/types';
import { Property } from '@asset-backend/real-estate/property/entities/property.entity';

interface OikotieAddress {
  street?: string;
  city?: string;
  postalCode?: string;
  district?: string;
}

interface OikotieImage {
  url?: string;
  type?: string;
  ordinal?: number;
}

interface OikotieCard {
  id?: number;
  cardId?: number;
  price?: number;
  debtPrice?: number;
  size?: number;
  buildYear?: number;
  buildingType?: string;
  roomConfiguration?: string;
  rooms?: number;
  condition?: string;
  energyClass?: string;
  maintenanceFee?: number;
  waterFee?: number;
  financingFee?: number;
  address?: OikotieAddress;
  images?: OikotieImage[];
  mainImage?: { url?: string };
}

interface OikotieData {
  card?: OikotieCard;
}

interface JsonLdAddress {
  streetAddress?: string;
  addressLocality?: string;
  postalCode?: string;
}

interface JsonLdData {
  name?: string;
  address?: JsonLdAddress;
  image?: string;
}

@Injectable()
export class OikotieImportService {
  private readonly logger = new Logger(OikotieImportService.name);

  /**
   * User-Agent header required for fetching oikotie.fi pages.
   * Oikotie.fi may block requests without a standard browser User-Agent.
   * This mimics a regular browser request.
   * Note: This is a web scraping approach - oikotie.fi may change their
   * anti-bot measures at any time, which could break this feature.
   */
  private readonly USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  private readonly TIMEOUT = 15000;

  constructor(private readonly propertyService: PropertyService) {}

  async createProspectProperty(
    user: JWTUser,
    url: string,
    monthlyRent?: number,
  ): Promise<Property> {
    const oikotieData = await this.fetchPropertyData(url);
    const propertyInput = this.createPropertyInput(oikotieData);

    // Add monthly rent if provided by user
    if (monthlyRent !== undefined) {
      propertyInput.monthlyRent = monthlyRent;
    }

    // Check if user already has a property with the same Oikotie ID
    const existingProperty = await this.propertyService.findByExternalSource(
      user,
      PropertyExternalSource.OIKOTIE,
      propertyInput.externalSourceId,
    );

    if (existingProperty) {
      this.logger.debug(
        `Updating existing property ${existingProperty.id} from Oikotie listing ${propertyInput.externalSourceId}`,
      );
      return this.propertyService.update(user, existingProperty.id, propertyInput);
    }

    this.logger.debug(
      `Creating new prospect property from Oikotie listing ${propertyInput.externalSourceId}`,
    );
    return this.propertyService.add(user, propertyInput);
  }

  async fetchPropertyData(url: string): Promise<OikotiePropertyDataDto> {
    this.validateUrl(url);

    const html = await this.fetchHtml(url);
    return this.parseHtml(url, html);
  }

  validateUrl(url: string): void {
    if (!url || url.trim() === '') {
      throw new BadRequestException(
        'URL must be a valid Oikotie property listing URL',
      );
    }

    const oikotiePattern = /^https?:\/\/(www\.)?asunnot\.oikotie\.fi\/myytavat-asunnot\//;
    if (!oikotiePattern.test(url)) {
      throw new BadRequestException(
        'URL must be a valid Oikotie property listing URL',
      );
    }
  }

  private async fetchHtml(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.USER_AGENT,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fi-FI,fi;q=0.9,en;q=0.8',
        },
        timeout: this.TIMEOUT,
      });

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          throw new NotFoundException('Property listing not found');
        }
        if (error.response?.status === 403) {
          throw new ServiceUnavailableException(
            'Access to oikotie.fi was blocked. Please try again later.',
          );
        }
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
          throw new ServiceUnavailableException(
            'Request to oikotie.fi timed out. Please try again.',
          );
        }
      }
      throw new ServiceUnavailableException(
        'Failed to fetch property data from oikotie.fi',
      );
    }
  }

  parseHtml(url: string, html: string): OikotiePropertyDataDto {
    // Try to extract data from window.otAsunnot first
    const oikotieData = this.extractOtAsunnot(html);
    // Fallback to JSON-LD data
    const jsonLdData = this.extractJsonLd(html);

    const card = oikotieData?.card;

    // Validate that we have at least some data to work with
    if (!card && !jsonLdData) {
      throw new InternalServerErrorException(
        'Could not extract data from listing. The page structure may have changed.',
      );
    }

    const result = new OikotiePropertyDataDto();
    result.url = url;

    // Parse price data from card
    if (card) {
      result.debtFreePrice = card.price ?? 0;
      result.debtShare = card.debtPrice || undefined;
      result.apartmentSize = card.size ?? 0;
      result.maintenanceFee = card.maintenanceFee ?? 0;
      result.waterFee = card.waterFee || undefined;
      result.financingFee = card.financingFee || undefined;
      result.buildingYear = card.buildYear || undefined;
      result.propertyType = card.buildingType || undefined;
      result.roomDescription = card.roomConfiguration || undefined;
      result.roomCount = card.rooms || undefined;
      result.condition = card.condition ? this.sanitizeCondition(card.condition) : undefined;
      result.energyClass = card.energyClass || undefined;

      // Parse address from card
      if (card.address) {
        result.city = card.address.city || undefined;
        result.postalCode = card.address.postalCode || undefined;
        result.district = card.address.district || undefined;

        // Build full address string
        const addressParts: string[] = [];
        if (card.address.street) {
          addressParts.push(card.address.street);
        }
        if (card.address.postalCode && card.address.city) {
          addressParts.push(`${card.address.postalCode} ${card.address.city}`);
        }
        if (addressParts.length > 0) {
          result.address = addressParts.join(', ');
        }
      }

      // Parse image URL
      result.defaultImageUrl = this.extractImageUrl(card);
    }

    // Fallback to JSON-LD data for missing fields
    if (jsonLdData) {
      if (!result.address && jsonLdData.name) {
        result.address = jsonLdData.name;
      }
      if (!result.city && jsonLdData.address?.addressLocality) {
        result.city = jsonLdData.address.addressLocality;
      }
      if (!result.postalCode && jsonLdData.address?.postalCode) {
        result.postalCode = jsonLdData.address.postalCode;
      }
      if (!result.defaultImageUrl && jsonLdData.image) {
        result.defaultImageUrl = this.normalizeImageUrl(jsonLdData.image);
      }
    }

    return result;
  }

  private extractOtAsunnot(html: string): OikotieData | null {
    // Look for window.otAsunnot = {...}
    const match = html.match(/window\.otAsunnot\s*=\s*(\{[\s\S]*?\});?\s*(?:<\/script>|$)/);

    if (!match) {
      return null;
    }

    try {
      const jsonStr = match[1];
      return JSON.parse(jsonStr) as OikotieData;
    } catch {
      // JSON parse failed, return null
      return null;
    }
  }

  private extractJsonLd(html: string): JsonLdData | null {
    // Look for <script type="application/ld+json">
    const match = html.match(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);

    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[1]) as JsonLdData;
    } catch {
      return null;
    }
  }

  private extractImageUrl(card: OikotieCard): string | undefined {
    // Try mainImage first
    if (card.mainImage?.url) {
      return this.normalizeImageUrl(card.mainImage.url);
    }

    // Try images array, find MAIN type or lowest ordinal
    if (card.images && Array.isArray(card.images) && card.images.length > 0) {
      // First try to find MAIN type
      const mainImage = card.images.find((img) => img.type === 'MAIN');
      if (mainImage?.url) {
        return this.normalizeImageUrl(mainImage.url);
      }

      // Fall back to first image by ordinal
      const sortedImages = [...card.images]
        .filter((img) => img.url)
        .sort((a, b) => (a.ordinal ?? 999) - (b.ordinal ?? 999));

      if (sortedImages.length > 0 && sortedImages[0].url) {
        return this.normalizeImageUrl(sortedImages[0].url);
      }
    }

    return undefined;
  }

  private normalizeImageUrl(url: string): string {
    // Convert protocol-relative URL (//...) to https://
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    return url;
  }

  private sanitizeCondition(condition: string): string {
    // Replace Unicode escapes and clean up condition string
    // e.g., "Hyv\u00e4" -> "Hyva" (simplified for consistency)
    return condition
      .replace(/\\u00e4/gi, 'a')
      .replace(/\\u00f6/gi, 'o')
      .replace(/\u00e4/gi, 'a')
      .replace(/\u00f6/gi, 'o');
  }

  private translatePropertyType(type?: string): PropertyType | undefined {
    if (!type) return undefined;

    const typeMap: Record<string, PropertyType> = {
      Kerrostalo: PropertyType.APARTMENT,
      Rivitalo: PropertyType.ROW_HOUSE,
      Paritalo: PropertyType.SEMI_DETACHED,
      Omakotitalo: PropertyType.DETACHED,
      Erillistalo: PropertyType.SEPARATE_HOUSE,
      Luhtitalo: PropertyType.GALLERY_ACCESS,
      Puutalo: PropertyType.WOODEN_HOUSE,
    };

    return typeMap[type];
  }

  createPropertyInput(oikotieData: OikotiePropertyDataDto): PropertyInputDto {
    const input = new PropertyInputDto();

    input.status = PropertyStatus.PROSPECT;
    input.externalSource = PropertyExternalSource.OIKOTIE;
    input.externalSourceId = this.extractIdFromUrl(oikotieData.url);
    input.name = oikotieData.address || this.extractNameFromUrl(oikotieData.url);
    input.size = oikotieData.apartmentSize;
    input.buildYear = oikotieData.buildingYear;
    input.apartmentType = this.translatePropertyType(oikotieData.propertyType);
    input.rooms = oikotieData.roomDescription;
    input.address = this.parseAddress(oikotieData);
    input.photo = oikotieData.defaultImageUrl;

    // Financial fields
    input.purchasePrice = oikotieData.debtFreePrice;
    input.debtShare = oikotieData.debtShare;
    input.maintenanceFee = oikotieData.maintenanceFee;
    input.financialCharge = oikotieData.financingFee;
    input.waterCharge = oikotieData.waterFee;

    return input;
  }

  private parseAddress(oikotieData: OikotiePropertyDataDto): AddressInputDto | undefined {
    if (!oikotieData.address) {
      return undefined;
    }

    const address = new AddressInputDto();

    // Oikotie address format: "Vaasankatu 10 A 5, 65100 Vaasa"
    // Extract street: everything before the first comma
    const commaIndex = oikotieData.address.indexOf(',');
    if (commaIndex > 0) {
      address.street = oikotieData.address.substring(0, commaIndex).trim();
    } else {
      address.street = oikotieData.address;
    }

    address.city = oikotieData.city;
    address.postalCode = oikotieData.postalCode;
    address.district = oikotieData.district;

    return address;
  }

  private extractIdFromUrl(url: string): string {
    // URL format: https://asunnot.oikotie.fi/myytavat-asunnot/{city}/{id}
    const match = url.match(/\/myytavat-asunnot\/[^/]+\/(\d+)/);
    return match ? match[1] : url;
  }

  private extractNameFromUrl(url: string): string {
    const id = this.extractIdFromUrl(url);
    return `Oikotie ${id}`;
  }
}
