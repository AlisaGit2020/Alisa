import {
  Injectable,
  BadRequestException,
  ServiceUnavailableException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { EtuoviPropertyDataDto } from './dtos/etuovi-property-data.dto';
import { PropertyInputDto } from '@asset-backend/real-estate/property/dtos/property-input.dto';
import { AddressInputDto } from '@asset-backend/real-estate/address/dtos/address-input.dto';
import {
  PropertyExternalSource,
  PropertyStatus,
} from '@asset-backend/common/types';
import { PropertyService } from '@asset-backend/real-estate/property/property.service';
import { JWTUser } from '@asset-backend/auth/types';
import { Property } from '@asset-backend/real-estate/property/entities/property.entity';

interface PeriodicCharge {
  periodicCharge: string;
  price: number;
  chargePeriod: string;
}

interface EtuoviPropertyData {
  debfFreePrice?: number;
  sellingPrice?: number;
  debtShareAmount?: number;
  livingArea?: number;
  periodicCharges?: PeriodicCharge[];
  address?: {
    streetAddress?: string;
    city?: string;
  };
  streetAddressFreeForm?: string;
  roomStructure?: string;
  buildingYear?: number;
  residentialPropertyType?: string;
  condition?: string;
  energyClass?: string;
  periodicChargesAdditionalInfo?: string;
  location?: {
    municipality?: {
      defaultName?: string;
    };
    postCode?: string;
  };
}

@Injectable()
export class EtuoviImportService {
  /**
   * User-Agent header required for fetching etuovi.com pages.
   * Etuovi.com blocks requests without a standard browser User-Agent,
   * returning 403 Forbidden. This mimics a regular browser request.
   * Note: This is a web scraping approach - etuovi.com may change their
   * anti-bot measures at any time, which could break this feature.
   */
  private readonly USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  private readonly TIMEOUT = 15000;

  constructor(private readonly propertyService: PropertyService) {}

  async createProspectProperty(user: JWTUser, url: string): Promise<Property> {
    const etuoviData = await this.fetchPropertyData(url);
    const propertyInput = this.createPropertyInput(etuoviData);
    return this.propertyService.add(user, propertyInput);
  }

  async fetchPropertyData(url: string): Promise<EtuoviPropertyDataDto> {
    this.validateUrl(url);

    const html = await this.fetchHtml(url);
    return this.parseHtml(url, html);
  }

  validateUrl(url: string): void {
    const etuoviPattern = /^https?:\/\/(www\.)?etuovi\.com\/kohde\//;
    if (!etuoviPattern.test(url)) {
      throw new BadRequestException(
        'URL must be a valid etuovi.com property listing URL',
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
            'Access to etuovi.com was blocked. Please try again later.',
          );
        }
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
          throw new ServiceUnavailableException(
            'Request to etuovi.com timed out. Please try again.',
          );
        }
      }
      throw new ServiceUnavailableException(
        'Failed to fetch property data from etuovi.com',
      );
    }
  }

  parseHtml(url: string, html: string): EtuoviPropertyDataDto {
    // Extract __INITIAL_STATE__ JSON from the page
    const jsonData = this.extractInitialState(html);

    if (!jsonData) {
      throw new InternalServerErrorException(
        'Could not extract data from listing. The page structure may have changed.',
      );
    }

    const result = new EtuoviPropertyDataDto();
    result.url = url;

    // Parse debt-free price (etuovi has a typo: "debfFreePrice" instead of "debtFreePrice")
    result.deptFreePrice = jsonData.debfFreePrice ?? jsonData.sellingPrice ?? 0;

    // Parse debt share (Velkaosuus)
    result.deptShare = jsonData.debtShareAmount || undefined;

    // Parse apartment size
    result.apartmentSize = jsonData.livingArea ?? 0;

    // Parse charges from periodicCharges array
    if (jsonData.periodicCharges && Array.isArray(jsonData.periodicCharges)) {
      const maintenanceCharge = jsonData.periodicCharges.find(
        (c) => c.periodicCharge === 'HOUSING_COMPANY_MAINTENANCE_CHARGE',
      );
      const financingCharge = jsonData.periodicCharges.find(
        (c) => c.periodicCharge === 'HOUSING_COMPANY_FINANCING_CHARGE',
      );

      result.maintenanceFee = maintenanceCharge?.price ?? 0;
      result.chargeForFinancialCosts = financingCharge?.price || undefined;
    }

    // Parse water charge from additional info text
    if (jsonData.periodicChargesAdditionalInfo) {
      const waterMatch = jsonData.periodicChargesAdditionalInfo.match(
        /[Vv]esimaksu[:\s]*(\d+(?:[,.]\d+)?)\s*€/,
      );
      if (waterMatch) {
        result.waterCharge = this.parseNumber(waterMatch[1]);
      }
    }

    // Parse address as "Sijainti - Huoneistoselitelmä"
    const addressParts: string[] = [];
    if (jsonData.streetAddressFreeForm) {
      addressParts.push(jsonData.streetAddressFreeForm);
    } else if (jsonData.address?.streetAddress) {
      addressParts.push(jsonData.address.streetAddress);
    }
    if (jsonData.roomStructure) {
      addressParts.push(jsonData.roomStructure);
    }
    result.address = addressParts.length > 0 ? addressParts.join(' - ') : undefined;

    // Parse other informational fields
    result.buildingYear = jsonData.buildingYear || undefined;
    result.propertyType = this.translatePropertyType(jsonData.residentialPropertyType);
    result.condition = jsonData.condition || undefined;
    result.energyClass = jsonData.energyClass || undefined;

    // Parse city and postal code from location
    result.city = jsonData.location?.municipality?.defaultName || undefined;
    result.postalCode = jsonData.location?.postCode || undefined;

    // Validate required fields
    if (result.deptFreePrice === 0) {
      throw new InternalServerErrorException(
        'Could not extract price from listing. The page structure may have changed.',
      );
    }
    if (result.apartmentSize === 0) {
      throw new InternalServerErrorException(
        'Could not extract apartment size from listing. The page structure may have changed.',
      );
    }
    // maintenanceFee can be 0 if there are no charges (rare but possible)

    return result;
  }

  private extractInitialState(html: string): EtuoviPropertyData | null {
    // Look for __INITIAL_STATE__ = {...}
    const match = html.match(/__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});?\s*(?:<\/script>|window\.|$)/);

    if (!match) {
      // No __INITIAL_STATE__ found, try extracting data directly from text
      return this.extractPropertyDataFromText(html);
    }

    try {
      const jsonStr = match[1];
      const state = JSON.parse(jsonStr);

      // The property data is typically nested in reduxAsyncConnect.item or similar
      // Let's search for the property data by looking for known keys
      const found = this.findPropertyData(state);
      if (found) return found;

      // If not found in parsed JSON, try text extraction
      return this.extractPropertyDataFromText(html);
    } catch {
      // Try a more lenient extraction - find JSON objects with our target keys
      return this.extractPropertyDataFromText(html);
    }
  }

  private findPropertyData(obj: unknown, depth = 0): EtuoviPropertyData | null {
    if (depth > 10) return null;
    if (obj === null || typeof obj !== 'object') return null;

    const record = obj as Record<string, unknown>;

    // Check if this object has our target properties
    if ('debfFreePrice' in record || 'sellingPrice' in record) {
      if ('livingArea' in record) {
        return record as unknown as EtuoviPropertyData;
      }
    }

    // Recursively search
    for (const value of Object.values(record)) {
      if (typeof value === 'object' && value !== null) {
        const found = this.findPropertyData(value, depth + 1);
        if (found) return found;
      }
    }

    return null;
  }

  private extractPropertyDataFromText(html: string): EtuoviPropertyData | null {
    const result: EtuoviPropertyData = {};

    // Extract debfFreePrice or sellingPrice
    const priceMatch = html.match(/"debfFreePrice":(\d+)/);
    if (priceMatch) {
      result.debfFreePrice = parseInt(priceMatch[1], 10);
    } else {
      const sellingPriceMatch = html.match(/"sellingPrice":(\d+)/);
      if (sellingPriceMatch) {
        result.sellingPrice = parseInt(sellingPriceMatch[1], 10);
      }
    }

    // Extract livingArea
    const areaMatch = html.match(/"livingArea":([\d.]+)/);
    if (areaMatch) {
      result.livingArea = parseFloat(areaMatch[1]);
    }

    // Extract debtShareAmount (Velkaosuus)
    const debtShareMatch = html.match(/"debtShareAmount":([\d.]+)/);
    if (debtShareMatch) {
      result.debtShareAmount = parseFloat(debtShareMatch[1]);
    }

    // Extract periodicCharges
    const chargesMatch = html.match(/"periodicCharges":\[([^\]]+)\]/);
    if (chargesMatch) {
      try {
        result.periodicCharges = JSON.parse(`[${chargesMatch[1]}]`);
      } catch {
        // Try extracting individual charges
        const maintenanceMatch = html.match(
          /"periodicCharge":"HOUSING_COMPANY_MAINTENANCE_CHARGE","price":([\d.]+)/,
        );
        if (maintenanceMatch) {
          result.periodicCharges = [
            {
              periodicCharge: 'HOUSING_COMPANY_MAINTENANCE_CHARGE',
              price: parseFloat(maintenanceMatch[1]),
              chargePeriod: 'MONTH',
            },
          ];
        }
      }
    }

    // Extract periodicChargesAdditionalInfo for water charge
    const additionalInfoMatch = html.match(
      /"periodicChargesAdditionalInfo":"([^"]+)"/,
    );
    if (additionalInfoMatch) {
      // Unescape unicode
      result.periodicChargesAdditionalInfo = additionalInfoMatch[1].replace(
        /\\u002F/g,
        '/',
      );
    }

    // Extract buildingYear
    const yearMatch = html.match(/"buildingYear":(\d{4})/);
    if (yearMatch) {
      result.buildingYear = parseInt(yearMatch[1], 10);
    }

    // Extract residentialPropertyType
    const typeMatch = html.match(/"residentialPropertyType":"([^"]+)"/);
    if (typeMatch) {
      result.residentialPropertyType = typeMatch[1];
    }

    // Extract streetAddressFreeForm
    const streetMatch = html.match(/"streetAddressFreeForm":"([^"]+)"/);
    if (streetMatch) {
      result.streetAddressFreeForm = this.unescapeUnicode(streetMatch[1]);
    }

    // Extract roomStructure
    const roomMatch = html.match(/"roomStructure":"([^"]+)"/);
    if (roomMatch) {
      result.roomStructure = this.unescapeUnicode(roomMatch[1]);
    }

    // Extract city from municipality.defaultName
    const cityMatch = html.match(/"municipality":\{[^}]*"defaultName":"([^"]+)"/);
    if (cityMatch) {
      result.location = result.location || {};
      result.location.municipality = { defaultName: this.unescapeUnicode(cityMatch[1]) };
    }

    // Extract postalCode from location.postCode
    const postCodeMatch = html.match(/"postCode":"(\d+)"/);
    if (postCodeMatch) {
      result.location = result.location || {};
      result.location.postCode = postCodeMatch[1];
    }

    if (result.debfFreePrice || result.sellingPrice) {
      return result;
    }

    return null;
  }

  private translatePropertyType(type?: string): string | undefined {
    if (!type) return undefined;

    const translations: Record<string, string> = {
      APARTMENT_HOUSE: 'Kerrostalo',
      ROW_HOUSE: 'Rivitalo',
      SEMI_DETACHED_HOUSE: 'Paritalo',
      DETACHED_HOUSE: 'Omakotitalo',
      CHAIN_HOUSE: 'Ketjutalo',
      HOLIDAY_HOME: 'Loma-asunto',
    };

    return translations[type] || type;
  }

  private parseNumber(value: string): number {
    const cleaned = value.replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
  }

  private unescapeUnicode(str: string): string {
    // Replace \u002F -> / and other common unicode escapes
    return str.replace(/\\u([0-9A-Fa-f]{4})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    );
  }

  createPropertyInput(etuoviData: EtuoviPropertyDataDto): PropertyInputDto {
    const input = new PropertyInputDto();

    input.status = PropertyStatus.PROSPECT;
    input.externalSource = PropertyExternalSource.ETUOVI;
    input.externalSourceId = this.extractIdFromUrl(etuoviData.url);
    input.name = etuoviData.address || this.extractNameFromUrl(etuoviData.url);
    input.size = etuoviData.apartmentSize;
    input.buildYear = etuoviData.buildingYear;
    input.apartmentType = etuoviData.propertyType;
    input.address = this.parseAddress(etuoviData);

    return input;
  }

  private parseAddress(etuoviData: EtuoviPropertyDataDto): AddressInputDto | undefined {
    if (!etuoviData.address) {
      return undefined;
    }

    const address = new AddressInputDto();
    // Etuovi address format: "Street 1 A 5 - 2h + k + kph"
    // The part before " - " is the street address
    const separatorIndex = etuoviData.address.indexOf(' - ');
    address.street =
      separatorIndex > 0
        ? etuoviData.address.substring(0, separatorIndex)
        : etuoviData.address;

    address.city = etuoviData.city;
    address.postalCode = etuoviData.postalCode;

    return address;
  }

  private extractIdFromUrl(url: string): string {
    const match = url.match(/\/kohde\/(\d+)/);
    return match ? match[1] : url;
  }

  private extractNameFromUrl(url: string): string {
    const id = this.extractIdFromUrl(url);
    return `Etuovi ${id}`;
  }
}
