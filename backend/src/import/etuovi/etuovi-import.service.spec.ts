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
  PropertyType,
} from '@asset-backend/common/types';
import { EtuoviPropertyDataDto } from './dtos/etuovi-property-data.dto';
import { PropertyService } from '@asset-backend/real-estate/property/property.service';

describe('EtuoviImportService', () => {
  let service: EtuoviImportService;
  let mockHtml: string;

  const mockPropertyService = {
    add: jest.fn(),
    update: jest.fn(),
    findByExternalSource: jest.fn(),
  };

  beforeAll(() => {
    const mockHtmlPath = path.join(MOCKS_PATH, 'import', 'etuovi.property.html');
    mockHtml = fs.readFileSync(mockHtmlPath, 'utf-8');
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EtuoviImportService,
        { provide: PropertyService, useValue: mockPropertyService },
      ],
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

    it('parses constructionFinishedYear as buildingYear fallback', () => {
      const htmlWithConstructionYear = `
        <script>
          window.__INITIAL_STATE__ = {
            "debfFreePrice": 100000,
            "livingArea": 50,
            "constructionFinishedYear": 2018,
            "periodicCharges": [
              {"periodicCharge": "HOUSING_COMPANY_MAINTENANCE_CHARGE", "price": 200}
            ]
          };
        </script>
      `;
      const result = service.parseHtml(testUrl, htmlWithConstructionYear);
      expect(result.buildingYear).toBe(2018);
    });

    it('parses property type correctly', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      // parseHtml now returns raw etuovi type, translation happens in createPropertyInput
      expect(result.propertyType).toBe('APARTMENT_HOUSE');
    });

    it('parses condition correctly', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      expect(result.condition).toBe('Hyvä');
    });

    it('parses energy class correctly', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      expect(result.energyClass).toBe('C');
    });

    it('parses city from municipality.defaultName', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      expect(result.city).toBe('Laihia');
    });

    it('parses postalCode from location.postCode', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      expect(result.postalCode).toBe('66400');
    });

    it('parses default image URL from mock HTML', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      // The MAIN image with ordinal 0 should be selected
      expect(result.defaultImageUrl).toBe('https://d3ls91xgksobn.cloudfront.net/etuovimedia/images/property/import/123/abc123/ORIGINAL.jpeg');
    });

    it('selects image with lowest ordinal as default from __INITIAL_STATE__', () => {
      // Image with ordinal 0 should be chosen even if it appears second in the JSON
      const htmlWithMultipleImages = `
        <html><script>
        window.__INITIAL_STATE__ = {
          "property": {
            "debfFreePrice": 100000,
            "livingArea": 50,
            "periodicCharges": [{"periodicCharge": "HOUSING_COMPANY_MAINTENANCE_CHARGE", "price": 200}],
            "images": {
              "999": {"id": 999, "propertyImageType": "OTHER", "ordinal": 2, "image": {"uri": "//example.com/second.jpg"}},
              "888": {"id": 888, "propertyImageType": "MAIN", "ordinal": 0, "image": {"uri": "//example.com/first.jpg"}}
            }
          }
        };
        </script></html>
      `;

      const result = service.parseHtml(testUrl, htmlWithMultipleImages);
      expect(result.defaultImageUrl).toBe('https://example.com/first.jpg');
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

    it('parses default image URL correctly', () => {
      // Etuovi uses an object with image IDs as keys, uri in nested image object
      const htmlWithImage = `
        <html><body>
        "debfFreePrice":100000,"livingArea":50,"periodicCharges":[{"periodicCharge":"HOUSING_COMPANY_MAINTENANCE_CHARGE","price":200,"chargePeriod":"MONTH"}],"images":{"123":{"id":123,"propertyImageType":"MAIN","ordinal":0,"image":{"id":123,"uuid":"abc-123","uri":"//d3ls91xgksobn.cloudfront.net/etuovimedia/images/property/123/abc/ORIGINAL.jpeg"}}}
        </body></html>
      `;

      const result = service.parseHtml(testUrl, htmlWithImage);
      expect(result.defaultImageUrl).toBe('https://d3ls91xgksobn.cloudfront.net/etuovimedia/images/property/123/abc/ORIGINAL.jpeg');
    });

    it('replaces {imageParameters} placeholder with default size', () => {
      const htmlWithPlaceholder = `
        <html><body>
        "debfFreePrice":100000,"livingArea":50,"periodicCharges":[{"periodicCharge":"HOUSING_COMPANY_MAINTENANCE_CHARGE","price":200,"chargePeriod":"MONTH"}],"images":{"123":{"id":123,"ordinal":0,"image":{"uri":"//d3ls91xgksobn.cloudfront.net/{imageParameters}/etuovimedia/images/test.jpeg"}}}
        </body></html>
      `;

      const result = service.parseHtml(testUrl, htmlWithPlaceholder);
      expect(result.defaultImageUrl).toBe('https://d3ls91xgksobn.cloudfront.net/1200x,q90/etuovimedia/images/test.jpeg');
    });

    it('unescapes unicode in image URI', () => {
      const htmlWithUnicode = `
        <html><body>
        "debfFreePrice":100000,"livingArea":50,"periodicCharges":[{"periodicCharge":"HOUSING_COMPANY_MAINTENANCE_CHARGE","price":200,"chargePeriod":"MONTH"}],"images":{"123":{"id":123,"ordinal":0,"image":{"uri":"\\u002F\\u002Fd3ls91xgksobn.cloudfront.net\\u002F{imageParameters}\\u002Fetuovimedia\\u002Fimages\\u002Ftest.jpeg"}}}
        </body></html>
      `;

      const result = service.parseHtml(testUrl, htmlWithUnicode);
      expect(result.defaultImageUrl).toBe('https://d3ls91xgksobn.cloudfront.net/1200x,q90/etuovimedia/images/test.jpeg');
    });

    it('returns undefined for defaultImageUrl when no images present', () => {
      const minimalHtml = `
        <html><body>
        "debfFreePrice":100000,"livingArea":50,"periodicCharges":[{"periodicCharge":"HOUSING_COMPANY_MAINTENANCE_CHARGE","price":200,"chargePeriod":"MONTH"}]
        </body></html>
      `;

      const result = service.parseHtml(testUrl, minimalHtml);
      expect(result.defaultImageUrl).toBeUndefined();
    });

    it('falls back to direct URI extraction when images JSON is malformed', () => {
      // Malformed images object that can't be parsed as JSON
      const htmlWithMalformedImages = `
        <html><body>
        "debfFreePrice":100000,"livingArea":50,"periodicCharges":[{"periodicCharge":"HOUSING_COMPANY_MAINTENANCE_CHARGE","price":200,"chargePeriod":"MONTH"}],"images":{"invalid json here,"image":{"id":123,"uri":"//example.com/fallback.jpg"}}
        </body></html>
      `;

      const result = service.parseHtml(testUrl, htmlWithMalformedImages);
      // Falls back to extracting URI directly from text
      expect(result.defaultImageUrl).toBe('https://example.com/fallback.jpg');
    });

    it('returns undefined when images JSON is malformed and no fallback URI found', () => {
      // Completely broken images object with no extractable URI
      const htmlWithBrokenImages = `
        <html><body>
        "debfFreePrice":100000,"livingArea":50,"periodicCharges":[{"periodicCharge":"HOUSING_COMPANY_MAINTENANCE_CHARGE","price":200,"chargePeriod":"MONTH"}],"images":{"broken": "data"
        </body></html>
      `;

      const result = service.parseHtml(testUrl, htmlWithBrokenImages);
      expect(result.defaultImageUrl).toBeUndefined();
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

    it('maps propertyType to apartmentType enum', () => {
      const etuoviData: EtuoviPropertyDataDto = {
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        propertyType: 'APARTMENT_HOUSE',
      };

      const result = service.createPropertyInput(etuoviData);

      expect(result.apartmentType).toBe(PropertyType.APARTMENT);
    });

    it('maps ROW_HOUSE to PropertyType.ROW_HOUSE', () => {
      const etuoviData: EtuoviPropertyDataDto = {
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        propertyType: 'ROW_HOUSE',
      };

      const result = service.createPropertyInput(etuoviData);

      expect(result.apartmentType).toBe(PropertyType.ROW_HOUSE);
    });

    it('maps DETACHED_HOUSE to PropertyType.DETACHED', () => {
      const etuoviData: EtuoviPropertyDataDto = {
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        propertyType: 'DETACHED_HOUSE',
      };

      const result = service.createPropertyInput(etuoviData);

      expect(result.apartmentType).toBe(PropertyType.DETACHED);
    });

    it('returns undefined apartmentType for unknown property type', () => {
      const etuoviData: EtuoviPropertyDataDto = {
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        propertyType: 'UNKNOWN_TYPE',
      };

      const result = service.createPropertyInput(etuoviData);

      expect(result.apartmentType).toBeUndefined();
    });

    it('maps roomStructure to rooms', () => {
      const etuoviData: EtuoviPropertyDataDto = {
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        roomStructure: '2h + k + kph',
      };

      const result = service.createPropertyInput(etuoviData);

      expect(result.rooms).toBe('2h + k + kph');
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

    it('maps city to address.city', () => {
      const etuoviData: EtuoviPropertyDataDto = {
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        address: 'Testikatu 5',
        city: 'Helsinki',
      };

      const result = service.createPropertyInput(etuoviData);

      expect(result.address).toBeDefined();
      expect(result.address.city).toBe('Helsinki');
    });

    it('maps postalCode to address.postalCode', () => {
      const etuoviData: EtuoviPropertyDataDto = {
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        address: 'Testikatu 5',
        postalCode: '00100',
      };

      const result = service.createPropertyInput(etuoviData);

      expect(result.address).toBeDefined();
      expect(result.address.postalCode).toBe('00100');
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

    it('maps defaultImageUrl to photo', () => {
      const etuoviData: EtuoviPropertyDataDto = {
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        defaultImageUrl: 'https://d3ls91xgksobn.cloudfront.net/etuovimedia/images/property/123/abc/ORIGINAL.jpeg',
      };

      const result = service.createPropertyInput(etuoviData);

      expect(result.photo).toBe('https://d3ls91xgksobn.cloudfront.net/etuovimedia/images/property/123/abc/ORIGINAL.jpeg');
    });

    it('stores full https URL for external image', () => {
      const etuoviData: EtuoviPropertyDataDto = {
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        defaultImageUrl: 'https://d3ls91xgksobn.cloudfront.net/image.jpg',
      };

      const result = service.createPropertyInput(etuoviData);

      expect(result.photo).toMatch(/^https:\/\//);
    });

    it('does not set photo when defaultImageUrl is missing', () => {
      const etuoviData: EtuoviPropertyDataDto = {
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
      };

      const result = service.createPropertyInput(etuoviData);

      expect(result.photo).toBeUndefined();
    });

    it('maps deptFreePrice to purchasePrice', () => {
      const etuoviData: EtuoviPropertyDataDto = {
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
      };

      const result = service.createPropertyInput(etuoviData);

      expect(result.purchasePrice).toBe(150000);
    });

    it('maps deptShare to debtShare', () => {
      const etuoviData: EtuoviPropertyDataDto = {
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        deptShare: 25000,
      };

      const result = service.createPropertyInput(etuoviData);

      expect(result.debtShare).toBe(25000);
    });

    it('maps maintenanceFee to maintenanceFee', () => {
      const etuoviData: EtuoviPropertyDataDto = {
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 180.50,
      };

      const result = service.createPropertyInput(etuoviData);

      expect(result.maintenanceFee).toBe(180.50);
    });

    it('maps chargeForFinancialCosts to financialCharge', () => {
      const etuoviData: EtuoviPropertyDataDto = {
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        chargeForFinancialCosts: 75.25,
      };

      const result = service.createPropertyInput(etuoviData);

      expect(result.financialCharge).toBe(75.25);
    });

    it('maps waterCharge to waterCharge', () => {
      const etuoviData: EtuoviPropertyDataDto = {
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        waterCharge: 18,
      };

      const result = service.createPropertyInput(etuoviData);

      expect(result.waterCharge).toBe(18);
    });

    it('does not set financial fields when not provided', () => {
      const etuoviData: EtuoviPropertyDataDto = {
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 0,
      };

      const result = service.createPropertyInput(etuoviData);

      expect(result.debtShare).toBeUndefined();
      expect(result.financialCharge).toBeUndefined();
      expect(result.waterCharge).toBeUndefined();
    });

    it('sets maintenanceFee to 0 when etuovi maintenanceFee is 0', () => {
      const etuoviData: EtuoviPropertyDataDto = {
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 0,
      };

      const result = service.createPropertyInput(etuoviData);

      expect(result.maintenanceFee).toBe(0);
    });
  });

  describe('createProspectProperty', () => {
    const mockUser = {
      id: 1,
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      language: 'fi',
      ownershipInProperties: [],
      isAdmin: false,
    };

    beforeEach(() => {
      mockPropertyService.add.mockReset();
      mockPropertyService.update.mockReset();
      mockPropertyService.findByExternalSource.mockReset();
    });

    it('calls propertyService.add with converted property input', async () => {
      const mockProperty = { id: 1, name: 'Test Property' };
      mockPropertyService.add.mockResolvedValue(mockProperty);

      jest.spyOn(service, 'fetchPropertyData').mockResolvedValue({
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        address: 'Testikatu 1 - 2h + k',
        buildingYear: 1990,
        propertyType: 'APARTMENT_HOUSE',
        roomStructure: '2h + k',
      });

      await service.createProspectProperty(
        mockUser,
        'https://www.etuovi.com/kohde/12345',
      );

      expect(mockPropertyService.add).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({
          status: PropertyStatus.PROSPECT,
          externalSource: PropertyExternalSource.ETUOVI,
          externalSourceId: '12345',
          name: 'Testikatu 1 - 2h + k',
          size: 65.5,
          buildYear: 1990,
          apartmentType: PropertyType.APARTMENT,
          rooms: '2h + k',
        }),
      );
    });

    it('returns the created property', async () => {
      const mockProperty = { id: 1, name: 'Test Property' };
      mockPropertyService.add.mockResolvedValue(mockProperty);

      jest.spyOn(service, 'fetchPropertyData').mockResolvedValue({
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
      });

      const result = await service.createProspectProperty(
        mockUser,
        'https://www.etuovi.com/kohde/12345',
      );

      expect(result).toBe(mockProperty);
    });

    it('propagates errors from fetchPropertyData', async () => {
      jest
        .spyOn(service, 'fetchPropertyData')
        .mockRejectedValue(new Error('Fetch failed'));

      await expect(
        service.createProspectProperty(
          mockUser,
          'https://www.etuovi.com/kohde/12345',
        ),
      ).rejects.toThrow('Fetch failed');
    });

    it('updates existing property when user already has property with same etuovi id', async () => {
      const existingProperty = {
        id: 99,
        name: 'Old Name',
        externalSource: PropertyExternalSource.ETUOVI,
        externalSourceId: '12345',
      };
      const updatedProperty = { id: 99, name: 'Testikatu 1 - 2h + k' };

      mockPropertyService.findByExternalSource.mockResolvedValue(existingProperty);
      mockPropertyService.update.mockResolvedValue(updatedProperty);

      jest.spyOn(service, 'fetchPropertyData').mockResolvedValue({
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        address: 'Testikatu 1 - 2h + k',
        buildingYear: 1990,
        propertyType: 'Kerrostalo',
      });

      const result = await service.createProspectProperty(
        mockUser,
        'https://www.etuovi.com/kohde/12345',
      );

      expect(mockPropertyService.findByExternalSource).toHaveBeenCalledWith(
        mockUser,
        PropertyExternalSource.ETUOVI,
        '12345',
      );
      expect(mockPropertyService.update).toHaveBeenCalledWith(
        mockUser,
        99,
        expect.objectContaining({
          name: 'Testikatu 1 - 2h + k',
          size: 65.5,
        }),
      );
      expect(mockPropertyService.add).not.toHaveBeenCalled();
      expect(result).toBe(updatedProperty);
    });

    it('creates new property when no existing property with same etuovi id', async () => {
      const newProperty = { id: 1, name: 'Test Property' };

      mockPropertyService.findByExternalSource.mockResolvedValue(null);
      mockPropertyService.add.mockResolvedValue(newProperty);

      jest.spyOn(service, 'fetchPropertyData').mockResolvedValue({
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
      });

      const result = await service.createProspectProperty(
        mockUser,
        'https://www.etuovi.com/kohde/12345',
      );

      expect(mockPropertyService.findByExternalSource).toHaveBeenCalledWith(
        mockUser,
        PropertyExternalSource.ETUOVI,
        '12345',
      );
      expect(mockPropertyService.add).toHaveBeenCalled();
      expect(mockPropertyService.update).not.toHaveBeenCalled();
      expect(result).toBe(newProperty);
    });

    it('sets monthlyRent when provided', async () => {
      const mockProperty = { id: 1, name: 'Test Property' };
      mockPropertyService.add.mockResolvedValue(mockProperty);
      mockPropertyService.findByExternalSource.mockResolvedValue(null);

      jest.spyOn(service, 'fetchPropertyData').mockResolvedValue({
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
      });

      await service.createProspectProperty(
        mockUser,
        'https://www.etuovi.com/kohde/12345',
        850,
      );

      expect(mockPropertyService.add).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({
          monthlyRent: 850,
        }),
      );
    });

    it('does not set monthlyRent when not provided', async () => {
      const mockProperty = { id: 1, name: 'Test Property' };
      mockPropertyService.add.mockResolvedValue(mockProperty);
      mockPropertyService.findByExternalSource.mockResolvedValue(null);

      jest.spyOn(service, 'fetchPropertyData').mockResolvedValue({
        url: 'https://www.etuovi.com/kohde/12345',
        deptFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
      });

      await service.createProspectProperty(
        mockUser,
        'https://www.etuovi.com/kohde/12345',
      );

      expect(mockPropertyService.add).toHaveBeenCalledWith(
        mockUser,
        expect.not.objectContaining({
          monthlyRent: expect.anything(),
        }),
      );
    });
  });
});
