# Oikotie Import Implementation Plan

## 1. Overview

This plan describes the implementation of an Oikotie property listing import feature for the backend. The feature will allow users to import property data from Oikotie.fi (a Finnish real estate listing website) by providing a URL, similar to the existing Etuovi import functionality.

The implementation will follow the exact same architectural pattern as the Etuovi import, consisting of:
- A service that fetches HTML, parses property data, and creates prospect properties
- A controller with two endpoints: `fetch` (unauthenticated) and `create-prospect` (authenticated)
- DTOs for input validation and data transfer
- Unit tests and E2E tests with mocked HTML data

### Key Differences from Etuovi

| Aspect | Etuovi | Oikotie |
|--------|--------|---------|
| URL Pattern | `https://etuovi.com/kohde/{id}` | `https://asunnot.oikotie.fi/myytavat-asunnot/{city}/{id}` |
| Data Location | `window.__INITIAL_STATE__` | `window.otAsunnot` + JSON-LD schema |
| External Source | `PropertyExternalSource.ETUOVI` (2) | `PropertyExternalSource.OIKOTIE` (1) |

## 2. Files to Create/Modify

### Files to Create

| File Path | Purpose |
|-----------|---------|
| `backend/src/import/oikotie/oikotie-import.service.ts` | Main service with fetch, parse, and create methods |
| `backend/src/import/oikotie/oikotie-import.controller.ts` | Controller with `/import/oikotie/fetch` and `/import/oikotie/create-prospect` |
| `backend/src/import/oikotie/dtos/oikotie-fetch-input.dto.ts` | Input DTO with URL validation |
| `backend/src/import/oikotie/dtos/oikotie-property-data.dto.ts` | Parsed property data DTO |
| `backend/src/import/oikotie/oikotie-import.service.spec.ts` | Unit tests for service |
| `backend/test/oikotie-import.controller.e2e-spec.ts` | E2E tests for controller |
| `backend/test/data/mocks/import/oikotie.property.html` | Mock HTML for tests |

### Files to Modify

| File Path | Change |
|-----------|--------|
| `backend/src/import/import.module.ts` | Register OikotieImportController and OikotieImportService |

## 3. Implementation Steps

### Step 1: Create Mock HTML Test Data

Create `backend/test/data/mocks/import/oikotie.property.html` with realistic Oikotie page structure:

```html
<!DOCTYPE html>
<html lang="fi">
<head>
  <title>Myytava kerrostalo, Vaasa - Oikotie</title>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Apartment",
    "name": "Vaasankatu 10 A 5",
    "offers": {
      "@type": "Offer",
      "price": 125000,
      "priceCurrency": "EUR"
    },
    "floorSize": {
      "@type": "QuantitativeValue",
      "value": 55.5,
      "unitCode": "MTK"
    },
    "numberOfRooms": 2,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Vaasankatu 10 A 5",
      "postalCode": "65100",
      "addressLocality": "Vaasa",
      "addressRegion": "Pohjanmaa"
    }
  }
  </script>
</head>
<body>
  <script>
    window.otAsunnot = {
      "card": {
        "cardId": 24322524,
        "address": "Vaasankatu 10 A 5, 65100 Vaasa",
        "analytics": {
          "price": 125000,
          "size": 55.5,
          "apartmentType": "Kerrostalo",
          "zipCode": "65100",
          "apartmentBuildYear": 1985,
          "roomCount": 2
        },
        "mainImage": {
          "url": "//images.oikotie.fi/property/24322524/main.jpg"
        }
      },
      "details": {
        "maintenanceFee": 180,
        "waterFee": 25,
        "financingFee": 75,
        "debtShare": 25000,
        "roomDescription": "2h+kk",
        "district": "Keskusta",
        "buildingType": "Kerrostalo",
        "condition": "Hyvä",
        "energyClass": "C"
      }
    };
  </script>
</body>
</html>
```

### Step 2: Create DTOs

#### `backend/src/import/oikotie/dtos/oikotie-fetch-input.dto.ts`

```typescript
import { IsNotEmpty, IsNumber, IsOptional, IsUrl, Matches } from 'class-validator';

export class OikotieFetchInputDto {
  @IsNotEmpty()
  @IsUrl()
  @Matches(/^https?:\/\/(www\.)?asunnot\.oikotie\.fi\/myytavat-asunnot\//, {
    message: 'URL must be a valid asunnot.oikotie.fi property listing URL',
  })
  url: string;

  @IsOptional()
  @IsNumber()
  monthlyRent?: number;
}
```

#### `backend/src/import/oikotie/dtos/oikotie-property-data.dto.ts`

```typescript
export class OikotiePropertyDataDto {
  url: string;
  cardId: string;
  debtFreePrice: number;
  debtShare?: number;
  apartmentSize: number;
  maintenanceFee: number;
  waterFee?: number;
  financingFee?: number;
  address?: string;
  city?: string;
  postalCode?: string;
  district?: string;
  buildingYear?: number;
  propertyType?: string;
  roomDescription?: string;
  roomCount?: number;
  condition?: string;
  energyClass?: string;
  defaultImageUrl?: string;
}
```

### Step 3: Create Service

#### `backend/src/import/oikotie/oikotie-import.service.ts`

The service should implement:

1. **`fetchPropertyData(url: string): Promise<OikotiePropertyDataDto>`**
   - Validate URL format
   - Fetch HTML with proper User-Agent header
   - Parse HTML to extract property data
   - Return structured DTO

2. **`createProspectProperty(user: JWTUser, url: string, monthlyRent?: number): Promise<Property>`**
   - Fetch property data
   - Convert to PropertyInputDto
   - Check for existing property with same Oikotie ID
   - Create or update property

3. **`parseHtml(url: string, html: string): OikotiePropertyDataDto`**
   - Extract `window.otAsunnot` JavaScript object
   - Extract JSON-LD schema.org data as fallback
   - Combine data from both sources
   - Handle missing fields gracefully

4. **`createPropertyInput(oikotieData: OikotiePropertyDataDto): PropertyInputDto`**
   - Map Oikotie fields to Property fields
   - Set status to PROSPECT
   - Set externalSource to OIKOTIE
   - Translate property types to enum values

### Step 4: Create Controller

#### `backend/src/import/oikotie/oikotie-import.controller.ts`

```typescript
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
```

### Step 5: Register in Import Module

Modify `backend/src/import/import.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { OpImportService } from './op/op-import.service';
import { AccountingModule } from '@asset-backend/accounting/accounting.module';
import { OpImportController } from './op/op-import.controller';
import { SPankkiImportService } from './s-pankki/s-pankki-import.service';
import { SPankkiImportController } from './s-pankki/s-pankki-import.controller';
import { AuthModule } from '@asset-backend/auth/auth.module';
import { RealEstateModule } from '@asset-backend/real-estate/real-estate.module';
import { EtuoviImportController } from './etuovi/etuovi-import.controller';
import { EtuoviImportService } from './etuovi/etuovi-import.service';
import { OikotieImportController } from './oikotie/oikotie-import.controller';
import { OikotieImportService } from './oikotie/oikotie-import.service';

@Module({
  controllers: [
    OpImportController,
    SPankkiImportController,
    EtuoviImportController,
    OikotieImportController,
  ],
  providers: [
    OpImportService,
    SPankkiImportService,
    EtuoviImportService,
    OikotieImportService,
  ],
  imports: [AccountingModule, AuthModule, RealEstateModule],
})
export class ImportModule {}
```

### Step 6: Create Unit Tests

Create `backend/src/import/oikotie/oikotie-import.service.spec.ts` covering:

- URL validation (valid/invalid patterns)
- HTML parsing (window.otAsunnot extraction)
- JSON-LD fallback extraction
- Field mapping to PropertyInputDto
- Property type translation
- Create/update property logic

### Step 7: Create E2E Tests

Create `backend/test/oikotie-import.controller.e2e-spec.ts` covering:

- POST `/import/oikotie/fetch` - URL validation errors
- POST `/import/oikotie/fetch` - Successful fetch with mocked response
- POST `/import/oikotie/fetch` - 404 handling
- POST `/import/oikotie/fetch` - 403/blocked handling
- POST `/import/oikotie/create-prospect` - Authentication required
- POST `/import/oikotie/create-prospect` - Creates prospect property
- POST `/import/oikotie/create-prospect` - Updates existing property
- POST `/import/oikotie/create-prospect` - Sets monthlyRent when provided

## 4. Data Flow

```
┌─────────────┐     ┌───────────────┐     ┌─────────────────────┐
│   Client    │────>│  Controller   │────>│      Service        │
│ (URL input) │     │ /import/oikotie│    │ OikotieImportService│
└─────────────┘     └───────────────┘     └──────────┬──────────┘
                                                      │
                    ┌─────────────────────────────────┼─────────────────────────────────┐
                    │                                 │                                 │
                    ▼                                 ▼                                 ▼
            ┌──────────────┐               ┌──────────────────┐             ┌──────────────────┐
            │ validateUrl  │               │    fetchHtml     │             │ createPropertyInput│
            │   (regex)    │               │    (axios)       │             │  (DTO mapping)   │
            └──────────────┘               └────────┬─────────┘             └────────┬─────────┘
                                                    │                                 │
                                                    ▼                                 ▼
                                          ┌──────────────────┐             ┌──────────────────┐
                                          │    parseHtml     │             │ PropertyService  │
                                          │ (extract data)   │             │ .add() / .update()│
                                          └──────────────────┘             └──────────────────┘
```

### Data Extraction Strategy

The service should attempt extraction in this order:

1. **Primary: `window.otAsunnot`** - Contains most structured data
   - `card.cardId` - Property ID
   - `card.analytics.*` - Price, size, type, year
   - `card.mainImage.url` - Default image
   - `details.*` - Fees, room description, condition

2. **Fallback: JSON-LD Schema.org** - Standard structured data
   - `offers.price` - Price
   - `floorSize.value` - Size
   - `numberOfRooms` - Room count
   - `address.*` - Address components

3. **Last Resort: Regex extraction** - For missing fields
   - Similar to Etuovi's `extractPropertyDataFromText` approach

## 5. Field Mapping

### Oikotie to OikotiePropertyDataDto

| Oikotie Source | DTO Field | Notes |
|----------------|-----------|-------|
| `card.cardId` | `cardId` | Used as externalSourceId |
| `card.analytics.price` | `debtFreePrice` | Primary price field |
| `details.debtShare` | `debtShare` | Velkaosuus |
| `card.analytics.size` | `apartmentSize` | m2 |
| `details.maintenanceFee` | `maintenanceFee` | Hoitovastike |
| `details.waterFee` | `waterFee` | Vesimaksu |
| `details.financingFee` | `financingFee` | Rahoitusvastike |
| `card.address` | `address` | Full address string |
| JSON-LD `address.addressLocality` | `city` | City name |
| `card.analytics.zipCode` | `postalCode` | Postal code |
| `details.district` | `district` | Kaupunginosa |
| `card.analytics.apartmentBuildYear` | `buildingYear` | Build year |
| `card.analytics.apartmentType` or `details.buildingType` | `propertyType` | E.g., "Kerrostalo" |
| `details.roomDescription` | `roomDescription` | E.g., "2h+kk" |
| `card.analytics.roomCount` | `roomCount` | Number |
| `details.condition` | `condition` | E.g., "Hyvä" |
| `details.energyClass` | `energyClass` | E.g., "C" |
| `card.mainImage.url` | `defaultImageUrl` | Property image |

### OikotiePropertyDataDto to PropertyInputDto

| OikotiePropertyDataDto Field | PropertyInputDto Field | Transformation |
|------------------------------|------------------------|----------------|
| - | `status` | Set to `PropertyStatus.PROSPECT` |
| - | `externalSource` | Set to `PropertyExternalSource.OIKOTIE` |
| `cardId` | `externalSourceId` | Direct mapping |
| `address` | `name` | Use as property name |
| `apartmentSize` | `size` | Direct mapping |
| `buildingYear` | `buildYear` | Direct mapping |
| `propertyType` | `apartmentType` | Translate to PropertyType enum |
| `roomDescription` | `rooms` | Direct mapping |
| `address` (parsed) | `address.street` | Extract street from full address |
| `city` | `address.city` | Direct mapping |
| `postalCode` | `address.postalCode` | Direct mapping |
| `district` | `address.district` | Direct mapping |
| `defaultImageUrl` | `photo` | Ensure https:// prefix |
| `debtFreePrice` | `purchasePrice` | Direct mapping |
| `debtShare` | `debtShare` | Direct mapping |
| `maintenanceFee` | `maintenanceFee` | Direct mapping |
| `financingFee` | `financialCharge` | Direct mapping |
| `waterFee` | `waterCharge` | Direct mapping |

### Property Type Translation

| Oikotie Type | PropertyType Enum |
|--------------|-------------------|
| `Kerrostalo` | `APARTMENT` |
| `Rivitalo` | `ROW_HOUSE` |
| `Paritalo` | `SEMI_DETACHED` |
| `Omakotitalo` | `DETACHED` |
| `Erillistalo` | `SEPARATE_HOUSE` |
| `Luhtitalo` | `GALLERY_ACCESS` |
| `Puutalo` | `WOODEN_HOUSE` |

## 6. Testing Strategy

### Unit Tests (`oikotie-import.service.spec.ts`)

**URL Validation Tests:**
- Accepts valid `https://asunnot.oikotie.fi/myytavat-asunnot/{city}/{id}` URL
- Accepts URL with www prefix
- Rejects non-Oikotie URLs
- Rejects Oikotie URLs without `/myytavat-asunnot/` path
- Rejects empty/invalid URLs

**HTML Parsing Tests:**
- Parses price from `window.otAsunnot.card.analytics.price`
- Parses size from `window.otAsunnot.card.analytics.size`
- Parses maintenance fee from `window.otAsunnot.details.maintenanceFee`
- Parses water fee from `window.otAsunnot.details.waterFee`
- Parses financing fee from `window.otAsunnot.details.financingFee`
- Parses debt share from `window.otAsunnot.details.debtShare`
- Parses address from `window.otAsunnot.card.address`
- Parses district from `window.otAsunnot.details.district`
- Parses building year from `window.otAsunnot.card.analytics.apartmentBuildYear`
- Parses property type from `window.otAsunnot.card.analytics.apartmentType`
- Parses room description from `window.otAsunnot.details.roomDescription`
- Parses image URL from `window.otAsunnot.card.mainImage.url`
- Falls back to JSON-LD schema when `window.otAsunnot` not available
- Extracts cardId from URL when not in data
- Returns undefined for optional fields when not present
- Throws error when no data can be extracted

**PropertyInput Creation Tests:**
- Sets status to PROSPECT
- Sets externalSource to OIKOTIE
- Sets externalSourceId from cardId
- Maps all financial fields correctly
- Translates property types to enum values
- Creates address DTO with all components
- Uses URL ID as fallback name when address missing

**createProspectProperty Tests:**
- Calls propertyService.add for new properties
- Calls propertyService.update for existing properties
- Sets monthlyRent when provided
- Propagates errors from fetchPropertyData

### E2E Tests (`oikotie-import.controller.e2e-spec.ts`)

**POST /import/oikotie/fetch Tests:**
- Returns 400 for invalid URL format
- Returns 400 for empty/missing URL
- Returns 400 for Oikotie URL without proper path
- Returns 200 with parsed data for valid URL (mocked with nock)
- Returns 404 when property listing not found
- Returns 503 when access is blocked
- Does not require authentication

**POST /import/oikotie/create-prospect Tests:**
- Returns 401 without authentication
- Returns 400 for invalid URL format
- Returns 404 when property listing not found
- Creates prospect property with status PROSPECT
- Sets externalSource to OIKOTIE
- Extracts externalSourceId from URL/data
- Sets name from address
- Sets size from apartmentSize
- Sets buildYear from Oikotie data
- Sets apartmentType from propertyType
- Parses address components correctly
- Assigns property to authenticated user
- Sets financial fields from Oikotie data
- Updates existing property when same Oikotie ID exists
- Sets monthlyRent when provided

### Mock Data Approach

- **NEVER use real Oikotie URLs in tests**
- Create `backend/test/data/mocks/import/oikotie.property.html` with realistic structure
- Use `nock` to intercept HTTP requests in E2E tests
- Load mock HTML from file system in unit tests
- Mock PropertyService in unit tests

## 7. CLAUDE.md Compliance Checklist

| Requirement | Compliance |
|-------------|------------|
| Backend service has unit tests | Yes - `oikotie-import.service.spec.ts` |
| Backend service has E2E tests | Yes - `oikotie-import.controller.e2e-spec.ts` |
| Unit tests colocated with service | Yes - in `backend/src/import/oikotie/` |
| E2E tests in backend/test/ | Yes - `backend/test/oikotie-import.controller.e2e-spec.ts` |
| DTOs use class-validator | Yes - `@IsNotEmpty`, `@IsUrl`, `@Matches`, `@IsOptional`, `@IsNumber` |
| DTOs in `/dtos` subdirectory | Yes - `backend/src/import/oikotie/dtos/` |
| Uses existing mock utilities | Yes - follows Etuovi pattern with MOCKS_PATH |
| Uses test factories | Yes - follows Etuovi pattern |
| Tests cover success cases | Yes - happy path tests included |
| Tests cover 404 errors | Yes - property not found tests |
| Tests cover 401 errors | Yes - authentication required tests |
| Tests cover 400 errors | Yes - validation error tests |
| Uses NestJS exceptions | Yes - `BadRequestException`, `NotFoundException`, `ServiceUnavailableException` |
| Uses `@User()` decorator | Yes - for extracting JWT user |
| Uses existing PropertyExternalSource | Yes - `PropertyExternalSource.OIKOTIE` (already exists) |
| No database migration needed | Yes - no schema changes |
| Follows existing Etuovi pattern | Yes - exact same structure |

## 8. Implementation Order

1. Create mock HTML file
2. Create DTOs (input and property data)
3. Create service with all methods
4. Create unit tests (TDD approach - write tests alongside implementation)
5. Create controller
6. Register in import module
7. Create E2E tests
8. Run all tests and verify
9. Manual testing (optional - for verification)

## 9. Estimated Effort

| Task | Time Estimate |
|------|---------------|
| Create mock HTML | 15 min |
| Create DTOs | 15 min |
| Create service | 2 hours |
| Create unit tests | 1.5 hours |
| Create controller | 15 min |
| Update import module | 5 min |
| Create E2E tests | 1 hour |
| Testing & fixes | 30 min |
| **Total** | **~6 hours** |

## 10. Notes

- The `PropertyExternalSource.OIKOTIE` enum value (1) already exists in `backend/src/common/types.ts`
- No database migration is required as this is purely a code-level feature
- The service should handle both `window.otAsunnot` (primary) and JSON-LD (fallback) data extraction
- Image URLs from Oikotie may use protocol-relative format (`//`) and should be converted to `https://`
- The URL pattern includes the city name, but the card ID is the unique identifier
