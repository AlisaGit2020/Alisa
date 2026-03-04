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

/**
 * Analytics object from var otAsunnot JSON
 * This matches the real Oikotie page structure
 */
interface OikotieAnalytics {
  cardId?: number;
  apartmentType?: string;
  apartmentTypeId?: number;
  size?: number;
  price?: number;
  zipCode?: string;
  locationPath?: string;
  apartmentBuildYear?: number;
}

/**
 * Root data structure from var otAsunnot JSON
 */
interface OikotieData {
  cardId?: number;
  analytics?: OikotieAnalytics;
  address?: string;
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
    // Try to extract data from var otAsunnot JSON first
    const oikotieData = this.extractOtAsunnot(html);
    // Fallback to JSON-LD data
    const jsonLdData = this.extractJsonLd(html);
    // Parse HTML tables for additional data (fees, condition, etc.)
    const htmlTableData = this.extractHtmlTableData(html);

    const analytics = oikotieData?.analytics;

    // Check if htmlTableData has any defined values
    const hasHtmlTableData = Object.values(htmlTableData).some(
      (value) => value !== undefined,
    );

    // Validate that we have at least some data to work with
    if (!analytics && !jsonLdData && !hasHtmlTableData) {
      throw new InternalServerErrorException(
        'Could not extract data from listing. The page structure may have changed.',
      );
    }

    const result = new OikotiePropertyDataDto();
    result.url = url;

    // Parse data from analytics object (from var otAsunnot JSON)
    if (analytics) {
      result.debtFreePrice = analytics.price ?? 0;
      result.apartmentSize = analytics.size ?? 0;
      result.buildingYear = analytics.apartmentBuildYear || undefined;
      result.propertyType = analytics.apartmentType || undefined;
      result.postalCode = analytics.zipCode || undefined;

      // Parse city from locationPath (e.g., "Vaasa/4 kaupunginosa/65100")
      if (analytics.locationPath) {
        const parts = analytics.locationPath.split('/');
        if (parts.length > 0) {
          result.city = parts[0];
        }
        if (parts.length > 1) {
          result.district = parts[1];
        }
      }
    }

    // Get address from oikotieData root level
    if (oikotieData?.address) {
      result.address = oikotieData.address;
    }

    // Parse fees and other data from HTML tables
    if (htmlTableData.maintenanceFee !== undefined) {
      result.maintenanceFee = htmlTableData.maintenanceFee;
    } else {
      result.maintenanceFee = 0;
    }
    if (htmlTableData.waterFee !== undefined) {
      result.waterFee = htmlTableData.waterFee;
    }
    if (htmlTableData.financingFee !== undefined) {
      result.financingFee = htmlTableData.financingFee;
    }
    if (htmlTableData.condition) {
      result.condition = this.sanitizeCondition(htmlTableData.condition);
    }
    if (htmlTableData.roomDescription) {
      result.roomDescription = htmlTableData.roomDescription;
    }
    if (htmlTableData.energyClass) {
      result.energyClass = htmlTableData.energyClass;
    }
    if (htmlTableData.debtShare !== undefined) {
      result.debtShare = htmlTableData.debtShare;
    }

    // Override with HTML data if analytics data is missing
    if (!result.apartmentSize && htmlTableData.size) {
      result.apartmentSize = htmlTableData.size;
    }
    if (!result.debtFreePrice && htmlTableData.debtFreePrice) {
      result.debtFreePrice = htmlTableData.debtFreePrice;
    }
    if (!result.buildingYear && htmlTableData.buildYear) {
      result.buildingYear = htmlTableData.buildYear;
    }
    if (!result.propertyType && htmlTableData.propertyType) {
      result.propertyType = htmlTableData.propertyType;
    }

    // Extract image URL from HTML
    result.defaultImageUrl = this.extractImageUrlFromHtml(html);

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
    // Look for var otAsunnot={...} (real Oikotie pages use this format)
    // Also support window.otAsunnot = {...} for backwards compatibility with tests
    const patterns = [
      /var otAsunnot=(\{[^;]+\});/,
      /window\.otAsunnot\s*=\s*(\{[\s\S]*?\});?\s*(?:<\/script>|$)/,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        try {
          const jsonStr = match[1];
          return JSON.parse(jsonStr) as OikotieData;
        } catch {
          // JSON parse failed, try next pattern
          continue;
        }
      }
    }

    return null;
  }

  /**
   * Extract data from HTML tables (info-table and details-grid)
   * This is where fees and other details are stored on real Oikotie pages
   */
  private extractHtmlTableData(html: string): {
    maintenanceFee?: number;
    waterFee?: number;
    financingFee?: number;
    condition?: string;
    roomDescription?: string;
    energyClass?: string;
    debtShare?: number;
    size?: number;
    debtFreePrice?: number;
    buildYear?: number;
    propertyType?: string;
  } {
    const result: ReturnType<typeof this.extractHtmlTableData> = {};

    // Helper to extract value after a title in HTML tables
    const extractTableValue = (titlePattern: string): string | null => {
      // Match both info-table and details-grid formats
      const patterns = [
        // info-table format: <dt class="info-table__title">Title</dt>...<dd class="info-table__value">Value</dd>
        new RegExp(
          `<dt[^>]*class="[^"]*info-table__title[^"]*"[^>]*>${titlePattern}</dt>[\\s\\S]*?<dd[^>]*class="[^"]*info-table__value[^"]*"[^>]*>([^<]+)</dd>`,
          'i',
        ),
        // details-grid format: <dt class="details-grid__item-title">Title</dt><dd class="details-grid__item-value">Value</dd>
        new RegExp(
          `<dt[^>]*class="[^"]*details-grid__item-title[^"]*"[^>]*>${titlePattern}</dt>[\\s\\S]*?<dd[^>]*class="[^"]*details-grid__item-value[^"]*"[^>]*>([^<]+)</dd>`,
          'i',
        ),
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
      return null;
    };

    // Helper to parse Finnish number format (154,35 -> 154.35)
    const parseNumber = (value: string | null): number | undefined => {
      if (!value) return undefined;
      // Remove currency symbols, spaces, and unit suffixes
      const cleaned = value
        .replace(/[€\s]/g, '')
        .replace('/ kk', '')
        .replace('/ kk', '')
        .replace('m²', '')
        .replace(',', '.')
        .trim();
      const num = parseFloat(cleaned);
      return isNaN(num) ? undefined : num;
    };

    // Extract maintenance fee (Hoitovastike)
    result.maintenanceFee = parseNumber(extractTableValue('Hoitovastike'));

    // Extract water fee (Vesimaksu)
    result.waterFee = parseNumber(extractTableValue('Vesimaksu'));

    // Extract financing fee (Rahoitusvastike)
    result.financingFee = parseNumber(extractTableValue('Rahoitusvastike'));

    // Extract condition (Kunto)
    result.condition = extractTableValue('Kunto') ?? undefined;

    // Extract room description (Huoneiston kokoonpano)
    result.roomDescription = extractTableValue('Huoneiston kokoonpano') ?? undefined;

    // Extract energy class (Energialuokka)
    result.energyClass = extractTableValue('Energialuokka') ?? undefined;

    // Extract debt share from selling price (Myyntihinta)
    // On Oikotie, if there's both "Velaton hinta" and "Myyntihinta", the difference is the debt
    const debtFreePrice = parseNumber(extractTableValue('Velaton hinta'));
    const sellingPrice = parseNumber(extractTableValue('Myyntihinta'));
    if (debtFreePrice !== undefined && sellingPrice !== undefined && debtFreePrice > sellingPrice) {
      result.debtShare = debtFreePrice - sellingPrice;
      result.debtFreePrice = debtFreePrice;
    } else if (debtFreePrice !== undefined) {
      result.debtFreePrice = debtFreePrice;
    }

    // Extract size (Asuinpinta-ala)
    result.size = parseNumber(extractTableValue('Asuinpinta-ala'));

    // Extract build year (Rakennusvuosi)
    const buildYearStr = extractTableValue('Rakennusvuosi');
    if (buildYearStr) {
      const year = parseInt(buildYearStr, 10);
      if (!isNaN(year) && year > 1800 && year < 2100) {
        result.buildYear = year;
      }
    }

    // Extract property type (Rakennuksen tyyppi)
    result.propertyType = extractTableValue('Rakennuksen tyyppi') ?? undefined;

    return result;
  }

  /**
   * Extract main image URL from HTML
   */
  private extractImageUrlFromHtml(html: string): string | undefined {
    // Look for og:image meta tag
    const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
    if (ogImageMatch && ogImageMatch[1]) {
      return this.normalizeImageUrl(ogImageMatch[1]);
    }

    // Look for main listing image
    const imgMatch = html.match(/<img[^>]*class="[^"]*listing-image[^"]*"[^>]*src="([^"]+)"/i);
    if (imgMatch && imgMatch[1]) {
      return this.normalizeImageUrl(imgMatch[1]);
    }

    return undefined;
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
