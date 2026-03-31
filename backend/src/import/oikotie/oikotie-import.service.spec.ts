import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { OikotieImportService } from './oikotie-import.service';
import { MOCKS_PATH } from '@asset-backend/constants';
import * as fs from 'fs';
import * as path from 'path';
import {
  PropertyExternalSource,
  PropertyStatus,
  PropertyType,
} from '@asset-backend/common/types';
import { OikotiePropertyDataDto } from './dtos/oikotie-property-data.dto';
import { PropertyService } from '@asset-backend/real-estate/property/property.service';
import { PropertyChargeService } from '@asset-backend/real-estate/property/property-charge.service';

describe('OikotieImportService', () => {
  let service: OikotieImportService;
  let mockHtml: string;

  const mockPropertyService = {
    add: jest.fn(),
    update: jest.fn(),
    findByExternalSource: jest.fn(),
  };

  const mockPropertyChargeService = {
    createBatch: jest.fn().mockResolvedValue([]),
  };

  beforeAll(() => {
    const mockHtmlPath = path.join(MOCKS_PATH, 'import', 'oikotie.property.html');
    mockHtml = fs.readFileSync(mockHtmlPath, 'utf-8');
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OikotieImportService,
        { provide: PropertyService, useValue: mockPropertyService },
        { provide: PropertyChargeService, useValue: mockPropertyChargeService },
      ],
    }).compile();

    service = module.get<OikotieImportService>(OikotieImportService);
  });

  describe('validateUrl', () => {
    it('accepts valid URL with city and ID', () => {
      expect(() => {
        service.validateUrl('https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524');
      }).not.toThrow();
    });

    it('accepts URL with www prefix', () => {
      expect(() => {
        service.validateUrl('https://www.asunnot.oikotie.fi/myytavat-asunnot/helsinki/12345678');
      }).not.toThrow();
    });

    it('accepts URL with http', () => {
      expect(() => {
        service.validateUrl('http://asunnot.oikotie.fi/myytavat-asunnot/turku/87654321');
      }).not.toThrow();
    });

    it('rejects non-Oikotie URLs', () => {
      expect(() => {
        service.validateUrl('https://www.etuovi.com/kohde/12345');
      }).toThrow(BadRequestException);
    });

    it('rejects Oikotie URLs without /myytavat-asunnot/ path', () => {
      expect(() => {
        service.validateUrl('https://asunnot.oikotie.fi/vuokrattavat-asunnot/helsinki/12345');
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
    const testUrl = 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524';

    it('parses debt-free price correctly', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      expect(result.debtFreePrice).toBe(125000);
    });

    it('parses debt share correctly', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      expect(result.debtShare).toBe(25000);
    });

    it('parses apartment size correctly', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      expect(result.apartmentSize).toBe(55.5);
    });

    it('parses maintenance fee correctly', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      expect(result.maintenanceFee).toBe(180);
    });

    it('parses water fee correctly', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      expect(result.waterFee).toBe(25);
    });

    it('parses financing fee correctly', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      expect(result.financingFee).toBe(75);
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
      expect(result.condition).toBe('Hyva');
    });

    it('parses energy class correctly', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      expect(result.energyClass).toBe('C');
    });

    it('parses city correctly', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      expect(result.city).toBe('Vaasa');
    });

    it('parses postal code correctly', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      expect(result.postalCode).toBe('65100');
    });

    it('parses district correctly', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      expect(result.district).toBe('Keskusta');
    });

    it('parses default image URL correctly', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      expect(result.defaultImageUrl).toBe('https://images.oikotie.fi/property/24322524/main.jpg');
    });

    it('includes the URL in result', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      expect(result.url).toBe(testUrl);
    });

    it('parses address correctly', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      expect(result.address).toBe('Vaasankatu 10 A 5, 65100 Vaasa');
    });

    it('parses room description correctly', () => {
      const result = service.parseHtml(testUrl, mockHtml);
      expect(result.roomDescription).toBe('2h+kk');
    });

    it('throws error when no data can be extracted', () => {
      const emptyHtml = '<html><body>No data here</body></html>';

      expect(() => {
        service.parseHtml(testUrl, emptyHtml);
      }).toThrow(InternalServerErrorException);
    });

    it('extracts data from JSON-LD when window.otAsunnot not available', () => {
      // HTML with only JSON-LD schema.org data
      const jsonLdOnlyHtml = `
        <html>
        <head>
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Residence",
              "name": "Testikatu 5",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Testikatu 5",
                "addressLocality": "Helsinki",
                "postalCode": "00100"
              },
              "image": "https://images.oikotie.fi/property/99999/main.jpg"
            }
          </script>
        </head>
        <body>
          <div class="listing-price">
            <span class="debt-free-price">200 000</span>
          </div>
          <div class="listing-details">
            <span class="size">75.5</span>
          </div>
          <div class="listing-charges">
            <span class="maintenance-fee">250</span>
          </div>
        </body>
        </html>
      `;

      const result = service.parseHtml(testUrl, jsonLdOnlyHtml);
      expect(result.address).toBe('Testikatu 5');
      expect(result.city).toBe('Helsinki');
      expect(result.postalCode).toBe('00100');
    });

    it('returns undefined for optional fields when not present', () => {
      const minimalHtml = `
        <html>
        <body>
          <script>
            var otAsunnot={"cardId":12345,"analytics":{"price":100000,"size":50},"address":"Test 1"};
          </script>
          <dl class="info-table">
            <dt class="info-table__title">Hoitovastike</dt>
            <dd class="info-table__value">200 € / kk</dd>
          </dl>
        </body>
        </html>
      `;

      const result = service.parseHtml(testUrl, minimalHtml);
      expect(result.debtShare).toBeUndefined();
      expect(result.waterFee).toBeUndefined();
      expect(result.financingFee).toBeUndefined();
      expect(result.buildingYear).toBeUndefined();
      expect(result.propertyType).toBeUndefined();
      expect(result.condition).toBeUndefined();
      expect(result.energyClass).toBeUndefined();
    });

    it('converts protocol-relative image URLs to https', () => {
      const htmlWithProtocolRelativeUrl = `
        <html>
        <head>
          <meta property="og:image" content="//images.oikotie.fi/property/12345/main.jpg">
        </head>
        <body>
          <script>
            var otAsunnot={"cardId":12345,"analytics":{"price":100000,"size":50},"address":"Test 1"};
          </script>
          <dl class="info-table">
            <dt class="info-table__title">Hoitovastike</dt>
            <dd class="info-table__value">200 € / kk</dd>
          </dl>
        </body>
        </html>
      `;

      const result = service.parseHtml(testUrl, htmlWithProtocolRelativeUrl);
      expect(result.defaultImageUrl).toBe('https://images.oikotie.fi/property/12345/main.jpg');
    });
  });

  describe('createPropertyInput', () => {
    it('creates property input with PROSPECT status', () => {
      const oikotieData: OikotiePropertyDataDto = {
        url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        debtFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        address: 'Testikatu 1 A 5, 65100 Vaasa',
        buildingYear: 1990,
        propertyType: 'Kerrostalo',
      };

      const result = service.createPropertyInput(oikotieData);

      expect(result.status).toBe(PropertyStatus.PROSPECT);
    });

    it('sets externalSource to OIKOTIE', () => {
      const oikotieData: OikotiePropertyDataDto = {
        url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        debtFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
      };

      const result = service.createPropertyInput(oikotieData);

      expect(result.externalSource).toBe(PropertyExternalSource.OIKOTIE);
    });

    it('sets externalSourceId to the card ID', () => {
      const oikotieData: OikotiePropertyDataDto = {
        url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        debtFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
      };

      const result = service.createPropertyInput(oikotieData);

      expect(result.externalSourceId).toBe('24322524');
    });

    it('uses address as property name', () => {
      const oikotieData: OikotiePropertyDataDto = {
        url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        debtFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        address: 'Vaasankatu 10 A 5, 65100 Vaasa',
      };

      const result = service.createPropertyInput(oikotieData);

      expect(result.name).toBe('Vaasankatu 10 A 5, 65100 Vaasa');
    });

    it('uses apartmentSize as size', () => {
      const oikotieData: OikotiePropertyDataDto = {
        url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        debtFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
      };

      const result = service.createPropertyInput(oikotieData);

      expect(result.size).toBe(65.5);
    });

    it('maps buildingYear to buildYear', () => {
      const oikotieData: OikotiePropertyDataDto = {
        url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        debtFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        buildingYear: 1995,
      };

      const result = service.createPropertyInput(oikotieData);

      expect(result.buildYear).toBe(1995);
    });

    it('maps propertyType to apartmentType enum (Kerrostalo -> APARTMENT)', () => {
      const oikotieData: OikotiePropertyDataDto = {
        url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        debtFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        propertyType: 'Kerrostalo',
      };

      const result = service.createPropertyInput(oikotieData);

      expect(result.apartmentType).toBe(PropertyType.APARTMENT);
    });

    it('maps ROW_HOUSE property type', () => {
      const oikotieData: OikotiePropertyDataDto = {
        url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        debtFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        propertyType: 'Rivitalo',
      };

      const result = service.createPropertyInput(oikotieData);

      expect(result.apartmentType).toBe(PropertyType.ROW_HOUSE);
    });

    it('maps DETACHED property type', () => {
      const oikotieData: OikotiePropertyDataDto = {
        url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        debtFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        propertyType: 'Omakotitalo',
      };

      const result = service.createPropertyInput(oikotieData);

      expect(result.apartmentType).toBe(PropertyType.DETACHED);
    });

    it('maps SEMI_DETACHED property type', () => {
      const oikotieData: OikotiePropertyDataDto = {
        url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        debtFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        propertyType: 'Paritalo',
      };

      const result = service.createPropertyInput(oikotieData);

      expect(result.apartmentType).toBe(PropertyType.SEMI_DETACHED);
    });

    it('returns undefined apartmentType for unknown property type', () => {
      const oikotieData: OikotiePropertyDataDto = {
        url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        debtFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        propertyType: 'UNKNOWN_TYPE',
      };

      const result = service.createPropertyInput(oikotieData);

      expect(result.apartmentType).toBeUndefined();
    });

    it('maps roomDescription to rooms', () => {
      const oikotieData: OikotiePropertyDataDto = {
        url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        debtFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        roomDescription: '2h+kk',
      };

      const result = service.createPropertyInput(oikotieData);

      expect(result.rooms).toBe('2h+kk');
    });

    it('uses URL ID as fallback name when address missing', () => {
      const oikotieData: OikotiePropertyDataDto = {
        url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        debtFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
      };

      const result = service.createPropertyInput(oikotieData);

      expect(result.name).toBe('Oikotie 24322524');
    });

    it('parses street from address', () => {
      const oikotieData: OikotiePropertyDataDto = {
        url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        debtFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        address: 'Vaasankatu 10 A 5, 65100 Vaasa',
        city: 'Vaasa',
        postalCode: '65100',
      };

      const result = service.createPropertyInput(oikotieData);

      expect(result.address).toBeDefined();
      expect(result.address.street).toBe('Vaasankatu 10 A 5');
    });

    it('maps city to address.city', () => {
      const oikotieData: OikotiePropertyDataDto = {
        url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        debtFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        address: 'Testikatu 5',
        city: 'Helsinki',
      };

      const result = service.createPropertyInput(oikotieData);

      expect(result.address).toBeDefined();
      expect(result.address.city).toBe('Helsinki');
    });

    it('maps postalCode to address.postalCode', () => {
      const oikotieData: OikotiePropertyDataDto = {
        url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        debtFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        address: 'Testikatu 5',
        postalCode: '00100',
      };

      const result = service.createPropertyInput(oikotieData);

      expect(result.address).toBeDefined();
      expect(result.address.postalCode).toBe('00100');
    });

    it('maps district to address.district', () => {
      const oikotieData: OikotiePropertyDataDto = {
        url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        debtFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        address: 'Testikatu 5',
        district: 'Keskusta',
      };

      const result = service.createPropertyInput(oikotieData);

      expect(result.address).toBeDefined();
      expect(result.address.district).toBe('Keskusta');
    });

    it('does not create address when address is missing', () => {
      const oikotieData: OikotiePropertyDataDto = {
        url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        debtFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
      };

      const result = service.createPropertyInput(oikotieData);

      expect(result.address).toBeUndefined();
    });

    it('maps defaultImageUrl to photo', () => {
      const oikotieData: OikotiePropertyDataDto = {
        url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        debtFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        defaultImageUrl: 'https://images.oikotie.fi/property/24322524/main.jpg',
      };

      const result = service.createPropertyInput(oikotieData);

      expect(result.photo).toBe('https://images.oikotie.fi/property/24322524/main.jpg');
    });

    it('maps debtFreePrice to purchasePrice', () => {
      const oikotieData: OikotiePropertyDataDto = {
        url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        debtFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
      };

      const result = service.createPropertyInput(oikotieData);

      expect(result.purchasePrice).toBe(150000);
    });

    it('maps debtShare to debtShare', () => {
      const oikotieData: OikotiePropertyDataDto = {
        url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        debtFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        debtShare: 25000,
      };

      const result = service.createPropertyInput(oikotieData);

      expect(result.debtShare).toBe(25000);
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
      mockPropertyChargeService.createBatch.mockReset();
      mockPropertyChargeService.createBatch.mockResolvedValue([]);
    });

    it('calls propertyService.add with converted property input', async () => {
      const mockProperty = { id: 1, name: 'Test Property' };
      mockPropertyService.add.mockResolvedValue(mockProperty);
      mockPropertyService.findByExternalSource.mockResolvedValue(null);

      jest.spyOn(service, 'fetchPropertyData').mockResolvedValue({
        url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        debtFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        address: 'Testikatu 1, 65100 Vaasa',
        buildingYear: 1990,
        propertyType: 'Kerrostalo',
        roomDescription: '2h+kk',
      });

      await service.createProspectProperty(
        mockUser,
        'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
      );

      expect(mockPropertyService.add).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({
          status: PropertyStatus.PROSPECT,
          externalSource: PropertyExternalSource.OIKOTIE,
          externalSourceId: '24322524',
          name: 'Testikatu 1, 65100 Vaasa',
          size: 65.5,
          buildYear: 1990,
          apartmentType: PropertyType.APARTMENT,
          rooms: '2h+kk',
        }),
      );
    });

    it('returns the created property', async () => {
      const mockProperty = { id: 1, name: 'Test Property' };
      mockPropertyService.add.mockResolvedValue(mockProperty);
      mockPropertyService.findByExternalSource.mockResolvedValue(null);

      jest.spyOn(service, 'fetchPropertyData').mockResolvedValue({
        url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        debtFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
      });

      const result = await service.createProspectProperty(
        mockUser,
        'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
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
          'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        ),
      ).rejects.toThrow('Fetch failed');
    });

    it('updates existing property when user already has property with same Oikotie ID', async () => {
      const existingProperty = {
        id: 99,
        name: 'Old Name',
        externalSource: PropertyExternalSource.OIKOTIE,
        externalSourceId: '24322524',
      };
      const updatedProperty = { id: 99, name: 'Testikatu 1, 65100 Vaasa' };

      mockPropertyService.findByExternalSource.mockResolvedValue(existingProperty);
      mockPropertyService.update.mockResolvedValue(updatedProperty);

      jest.spyOn(service, 'fetchPropertyData').mockResolvedValue({
        url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        debtFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        address: 'Testikatu 1, 65100 Vaasa',
        buildingYear: 1990,
        propertyType: 'Kerrostalo',
      });

      const result = await service.createProspectProperty(
        mockUser,
        'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
      );

      expect(mockPropertyService.findByExternalSource).toHaveBeenCalledWith(
        mockUser,
        PropertyExternalSource.OIKOTIE,
        '24322524',
      );
      expect(mockPropertyService.update).toHaveBeenCalledWith(
        mockUser,
        99,
        expect.objectContaining({
          name: 'Testikatu 1, 65100 Vaasa',
          size: 65.5,
        }),
      );
      expect(mockPropertyService.add).not.toHaveBeenCalled();
      expect(result).toBe(updatedProperty);
    });

    it('creates new property when no existing property with same Oikotie ID', async () => {
      const newProperty = { id: 1, name: 'Test Property' };

      mockPropertyService.findByExternalSource.mockResolvedValue(null);
      mockPropertyService.add.mockResolvedValue(newProperty);

      jest.spyOn(service, 'fetchPropertyData').mockResolvedValue({
        url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        debtFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
      });

      const result = await service.createProspectProperty(
        mockUser,
        'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
      );

      expect(mockPropertyService.findByExternalSource).toHaveBeenCalledWith(
        mockUser,
        PropertyExternalSource.OIKOTIE,
        '24322524',
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
        url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        debtFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
      });

      await service.createProspectProperty(
        mockUser,
        'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
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
        url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        debtFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
      });

      await service.createProspectProperty(
        mockUser,
        'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
      );

      expect(mockPropertyService.add).toHaveBeenCalledWith(
        mockUser,
        expect.not.objectContaining({
          monthlyRent: expect.anything(),
        }),
      );
    });

    it('creates charges from Oikotie data', async () => {
      const mockProperty = { id: 1, name: 'Test Property' };
      mockPropertyService.add.mockResolvedValue(mockProperty);
      mockPropertyService.findByExternalSource.mockResolvedValue(null);

      jest.spyOn(service, 'fetchPropertyData').mockResolvedValue({
        url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        debtFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 200,
        financingFee: 75,
        waterFee: 25,
      });

      await service.createProspectProperty(
        mockUser,
        'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
      );

      expect(mockPropertyChargeService.createBatch).toHaveBeenCalledWith(
        mockUser,
        1,
        expect.arrayContaining([
          expect.objectContaining({
            chargeType: 1, // MAINTENANCE_FEE
            amount: 200,
            startDate: null,
          }),
          expect.objectContaining({
            chargeType: 2, // FINANCIAL_CHARGE
            amount: 75,
            startDate: null,
          }),
          expect.objectContaining({
            chargeType: 3, // WATER_PREPAYMENT
            amount: 25,
            startDate: null,
          }),
        ]),
      );
    });

    it('does not create charges when fees are zero', async () => {
      const mockProperty = { id: 1, name: 'Test Property' };
      mockPropertyService.add.mockResolvedValue(mockProperty);
      mockPropertyService.findByExternalSource.mockResolvedValue(null);

      jest.spyOn(service, 'fetchPropertyData').mockResolvedValue({
        url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        debtFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 0,
      });

      await service.createProspectProperty(
        mockUser,
        'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
      );

      expect(mockPropertyChargeService.createBatch).not.toHaveBeenCalled();
    });

    it('creates charges when updating existing property', async () => {
      const existingProperty = {
        id: 99,
        name: 'Old Name',
        externalSource: PropertyExternalSource.OIKOTIE,
        externalSourceId: '24322524',
      };
      const updatedProperty = { id: 99, name: 'Testikatu 1, 65100 Vaasa' };

      mockPropertyService.findByExternalSource.mockResolvedValue(existingProperty);
      mockPropertyService.update.mockResolvedValue(updatedProperty);

      jest.spyOn(service, 'fetchPropertyData').mockResolvedValue({
        url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
        debtFreePrice: 150000,
        apartmentSize: 65.5,
        maintenanceFee: 180,
        financingFee: 70,
      });

      await service.createProspectProperty(
        mockUser,
        'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524',
      );

      expect(mockPropertyChargeService.createBatch).toHaveBeenCalledWith(
        mockUser,
        99,
        expect.arrayContaining([
          expect.objectContaining({
            chargeType: 1, // MAINTENANCE_FEE
            amount: 180,
          }),
          expect.objectContaining({
            chargeType: 2, // FINANCIAL_CHARGE
            amount: 70,
          }),
        ]),
      );
    });
  });
});
