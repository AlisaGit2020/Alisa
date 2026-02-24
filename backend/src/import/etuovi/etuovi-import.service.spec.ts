import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { EtuoviImportService } from './etuovi-import.service';
import { MOCKS_PATH } from '@asset-backend/constants';
import * as fs from 'fs';
import * as path from 'path';
import {
  PropertyExternalSource,
  PropertyStatus,
} from '@asset-backend/common/types';
import { EtuoviPropertyDataDto } from './dtos/etuovi-property-data.dto';

describe('EtuoviImportService', () => {
  let service: EtuoviImportService;
  let mockHtml: string;

  beforeAll(() => {
    const mockHtmlPath = path.join(MOCKS_PATH, 'import', 'etuovi.property.html');
    mockHtml = fs.readFileSync(mockHtmlPath, 'utf-8');
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EtuoviImportService],
    }).compile();

    service = module.get<EtuoviImportService>(EtuoviImportService);
  });

  describe('validateUrl', () => {
    it('accepts valid etuovi.com URL with www', () => {
      expect(() => {
        service.validateUrl('https://www.etuovi.com/kohde/80481676');
      }).not.toThrow();
    });

    it('accepts valid etuovi.com URL without www', () => {
      expect(() => {
        service.validateUrl('https://etuovi.com/kohde/80481676');
      }).not.toThrow();
    });

    it('accepts URL with http', () => {
      expect(() => {
        service.validateUrl('http://www.etuovi.com/kohde/80481676');
      }).not.toThrow();
    });

    it('rejects non-etuovi URL', () => {
      expect(() => {
        service.validateUrl('https://oikotie.fi/kohde/123');
      }).toThrow(BadRequestException);
    });

    it('rejects etuovi URL without kohde path', () => {
      expect(() => {
        service.validateUrl('https://www.etuovi.com/myytavat-asunnot');
      }).toThrow(BadRequestException);
    });

    it('rejects empty URL', () => {
      expect(() => {
        service.validateUrl('');
      }).toThrow(BadRequestException);
    });

    it('rejects random text', () => {
      expect(() => {
        service.validateUrl('not a url at all');
      }).toThrow(BadRequestException);
    });
  });

  describe('parseHtml', () => {
    const testUrl = 'https://www.etuovi.com/kohde/test123';

    it('parses debt-free price correctly', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      expect(result.deptFreePrice).toBe(125000);
    });

    it('parses debt share correctly', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      expect(result.deptShare).toBe(25000);
    });

    it('parses apartment size correctly', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      expect(result.apartmentSize).toBe(55.5);
    });

    it('parses maintenance fee correctly', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      expect(result.maintenanceFee).toBe(180);
    });

    it('parses water charge correctly', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      expect(result.waterCharge).toBe(25);
    });

    it('parses financial charge correctly', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      expect(result.chargeForFinancialCosts).toBe(75);
    });

    it('parses building year correctly', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      expect(result.buildingYear).toBe(1985);
    });

    it('parses property type correctly', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      expect(result.propertyType).toBe('Kerrostalo');
    });

    it('parses condition correctly', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      expect(result.condition).toBe('Hyvä');
    });

    it('parses energy class correctly', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      expect(result.energyClass).toBe('C');
    });

    it('includes the URL in result', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      expect(result.url).toBe(testUrl);
    });

    it('parses address as location + room structure', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      expect(result.address).toBe('Laihiantie 10 A 5 - 2h + k + kph');
    });

    it('throws error when no data can be extracted', () => {
      const emptyHtml = '<html><body>No data here</body></html>';

      expect(() => {
        service.parseHtml(testUrl, emptyHtml);
      }).toThrow(InternalServerErrorException);
    });

    it('extracts data from inline JSON when __INITIAL_STATE__ is not available', () => {
      // Service uses regex to extract fields directly from HTML text
      const inlineJsonHtml = `
        <html><body>
        "debfFreePrice":200000,"livingArea":75.5,"periodicCharges":[{"periodicCharge":"HOUSING_COMPANY_MAINTENANCE_CHARGE","price":250,"chargePeriod":"MONTH"}],"streetAddressFreeForm":"Test Street 1","roomStructure":"3h + k"
        </body></html>
      `;

      const result = service.parseHtml(testUrl, inlineJsonHtml);
      expect(result.deptFreePrice).toBe(200000);
      expect(result.apartmentSize).toBe(75.5);
      expect(result.maintenanceFee).toBe(250);
      expect(result.address).toBe('Test Street 1 - 3h + k');
    });

    it('uses sellingPrice when debfFreePrice is not available', () => {
      const sellingPriceHtml = `
        <html><body>
        "sellingPrice":85000,"livingArea":45,"periodicCharges":[{"periodicCharge":"HOUSING_COMPANY_MAINTENANCE_CHARGE","price":150,"chargePeriod":"MONTH"}]
        </body></html>
      `;

      const result = service.parseHtml(testUrl, sellingPriceHtml);
      expect(result.deptFreePrice).toBe(85000);
    });

    it('returns undefined for optional fields when not present', () => {
      const minimalHtml = `
        <html><body>
        "debfFreePrice":100000,"livingArea":50,"periodicCharges":[{"periodicCharge":"HOUSING_COMPANY_MAINTENANCE_CHARGE","price":200,"chargePeriod":"MONTH"}]
        </body></html>
      `;

      const result = service.parseHtml(testUrl, minimalHtml);
      expect(result.deptShare).toBeUndefined();
      expect(result.waterCharge).toBeUndefined();
      expect(result.chargeForFinancialCosts).toBeUndefined();
      expect(result.buildingYear).toBeUndefined();
      expect(result.propertyType).toBeUndefined();
      expect(result.condition).toBeUndefined();
      expect(result.energyClass).toBeUndefined();
    });

    it('unescapes unicode characters in room structure', () => {
      const unicodeHtml = `
        <html><body>
        "debfFreePrice":100000,"livingArea":50,"periodicCharges":[{"periodicCharge":"HOUSING_COMPANY_MAINTENANCE_CHARGE","price":200,"chargePeriod":"MONTH"}],"streetAddressFreeForm":"Test 1","roomStructure":"1h + k + kph \\u002F wc"
        </body></html>
      `;

      const result = service.parseHtml(testUrl, unicodeHtml);
      expect(result.address).toBe('Test 1 - 1h + k + kph / wc');
    });
  });

  describe('createPropertyInput', () => {
    it('creates property input with PROSPECT status', () => {
      const etuoviData: EtuoviPropertyDataDto = {
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        address: 'Testikatu 1 A - 3h + k',
        buildingYear: 1990,
        propertyType: 'Kerrostalo',
      };

      const result = service.createPropertyInput(etuoviData);

      expect(result.status).toBe(PropertyStatus.PROSPECT);
    });

    it('sets externalSource to ETUOVI', () => {
      const etuoviData: EtuoviPropertyDataDto = {
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
      };

      const result = service.createPropertyInput(etuoviData);

      expect(result.externalSource).toBe(PropertyExternalSource.ETUOVI);
    });

    it('sets externalSourceId to the parsed ID from URL', () => {
      const etuoviData: EtuoviPropertyDataDto = {
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
      };

      const result = service.createPropertyInput(etuoviData);

      expect(result.externalSourceId).toBe('12345');
    });

    it('uses address as property name', () => {
      const etuoviData: EtuoviPropertyDataDto = {
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        address: 'Testikatu 1 A - 3h + k',
      };

      const result = service.createPropertyInput(etuoviData);

      expect(result.name).toBe('Testikatu 1 A - 3h + k');
    });

    it('uses apartmentSize as size', () => {
      const etuoviData: EtuoviPropertyDataDto = {
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
      };

      const result = service.createPropertyInput(etuoviData);

      expect(result.size).toBe(65.5);
    });

    it('maps buildingYear to buildYear', () => {
      const etuoviData: EtuoviPropertyDataDto = {
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        buildingYear: 1995,
      };

      const result = service.createPropertyInput(etuoviData);

      expect(result.buildYear).toBe(1995);
    });

    it('maps propertyType to apartmentType', () => {
      const etuoviData: EtuoviPropertyDataDto = {
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        propertyType: 'Rivitalo',
      };

      const result = service.createPropertyInput(etuoviData);

      expect(result.apartmentType).toBe('Rivitalo');
    });

    it('uses URL as fallback name when address is missing', () => {
      const etuoviData: EtuoviPropertyDataDto = {
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
      };

      const result = service.createPropertyInput(etuoviData);

      expect(result.name).toBe('Etuovi 12345');
    });

    it('parses street from address (part before " - ")', () => {
      const etuoviData: EtuoviPropertyDataDto = {
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        address: 'Laihiantie 10 A 5 - 2h + k + kph',
      };

      const result = service.createPropertyInput(etuoviData);

      expect(result.address).toBeDefined();
      expect(result.address.street).toBe('Laihiantie 10 A 5');
    });

    it('uses full address as street when no separator', () => {
      const etuoviData: EtuoviPropertyDataDto = {
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        address: 'Testikatu 5',
      };

      const result = service.createPropertyInput(etuoviData);

      expect(result.address).toBeDefined();
      expect(result.address.street).toBe('Testikatu 5');
    });

    it('does not create address when etuovi address is missing', () => {
      const etuoviData: EtuoviPropertyDataDto = {
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
      };

      const result = service.createPropertyInput(etuoviData);

      expect(result.address).toBeUndefined();
    });
  });
});
