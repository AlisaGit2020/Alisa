# Vero-näkymä (Tax View) Design

## Yleiskuvaus

Luodaan vero-näkymä joka laskee ja näyttää asuntosijoittajan verottajalle tarvitsemat tiedot. Näkymä tukee sekä yksittäisen asunnon että kaikkien asuntojen verotietojen tarkastelua.

## Tietomalli

### ExpenseType-entiteetin laajennus

Lisätään kenttä perusparannusten tunnistamiseen:

```typescript
@Column({ default: false })
isCapitalImprovement: boolean;  // Perusparannus - 10% vuosipoisto
```

### Uudet StatisticKey-arvot

Lisätään `common/types.ts`-tiedostoon:

- `tax_gross_income` – Bruttovuokratulot
- `tax_deductions` – Vähennyskelpoiset menot (ei perusparannukset)
- `tax_depreciation` – Perusparannuspoistot (10%)
- `tax_net_income` – Verotettava tulo

### Laskentalogikka

```
tax_gross_income = SUM(income.totalAmount) vuodelta X
tax_deductions = SUM(expense.totalAmount) WHERE expenseType.isTaxDeductible = true AND isCapitalImprovement = false
tax_depreciation = SUM(expense.totalAmount) WHERE isCapitalImprovement = true × 0.10
tax_net_income = tax_gross_income - tax_deductions - tax_depreciation
```

Tallennus: `property_statistics` tauluun `year`-kentällä, `month = null`.

## Backend API

### POST /property/tax/calculate

Laskee ja tallentaa verotiedot.

**Request:**
```typescript
{
  propertyId?: number,  // Jos ei annettu, laskee kaikille käyttäjän asunnoille
  year: number
}
```

**Response:**
```typescript
{
  year: number,
  grossIncome: number,
  deductions: number,
  depreciation: number,
  netIncome: number,
  breakdown: TaxBreakdownItem[]
}
```

### GET /property/tax

Hakee tallennetut verotiedot.

**Query params:**
- `propertyId` (optional) – asunnon ID
- `year` – verovuosi

**Response:**
```typescript
{
  year: number,
  grossIncome: number,
  deductions: number,
  depreciation: number,
  netIncome: number,
  breakdown: [
    {
      category: string,
      amount: number,
      isTaxDeductible: boolean,
      isCapitalImprovement?: boolean,
      depreciationAmount?: number
    }
  ]
}
```

## Frontend UI

### Sivun rakenne

```
┌─────────────────────────────────────────────────────────┐
│  Verotus                           [Vuosi: 2024 ▼]      │
├─────────────────────────────────────────────────────────┤
│  ℹ️ Nämä tiedot tarvitset veroilmoitukseen.             │
│     Kopioi luvut lomakkeelle 7H (Osakehuoneistot).      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │ Vuokratulot │ │ Vähennykset │ │ Verotettava │        │
│  │   12 000 €  │ │   3 700 €   │ │   8 300 €   │        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
│                                                         │
│  [Laske verotiedot]                                     │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Lomake 7H: Vuokratulot - Osakehuoneistot               │
├─────────────────────────────────────────────────────────┤
│  Vuokratulot yhteensä                        12 000 €   │
├─────────────────────────────────────────────────────────┤
│  Vähennykset:                                           │
│    Hoitovastike                               2 400 €   │
│    Korjaukset                                 1 100 €   │
│  Vähennykset yhteensä                         3 500 €   │
├─────────────────────────────────────────────────────────┤
│  Perusparannuspoistot (10%):                            │
│    Keittiöremontti (2 000 € × 10%)              200 €   │
│  Poistot yhteensä                               200 €   │
├─────────────────────────────────────────────────────────┤
│  Verotettava tulo                             8 300 €   │
└─────────────────────────────────────────────────────────┘
```

### Komponentit

- `TaxView.tsx` – Pääsivu
- `TaxSummaryCards.tsx` – Kolme korttia ylhäällä (bruttotulo, vähennykset, verotettava)
- `TaxBreakdown.tsx` – 7H-lomakkeen mukainen erittely

### Toiminnot

- Vuoden vaihto dropdown → lataa tallennetut tiedot tai näyttää tyhjän tilan
- "Laske verotiedot" -painike → kutsuu POST /property/tax/calculate ja päivittää näkymän
- AppBarin asuntovalinta määrää näytettävän asunnon (tai kaikki)

## Tiedostorakenne

### Backend (uudet/muokattavat)

- `backend/src/accounting/expense/entities/expense-type.entity.ts` – lisää `isCapitalImprovement`
- `backend/src/common/types.ts` – lisää uudet StatisticKey-arvot
- `backend/src/real-estate/property/tax.service.ts` – uusi service
- `backend/src/real-estate/property/tax.controller.ts` – uusi controller
- `backend/src/real-estate/property/dtos/tax-calculate-input.dto.ts`
- `backend/src/real-estate/property/dtos/tax-response.dto.ts`
- `backend/src/real-estate/real-estate.module.ts` – rekisteröi uudet palvelut

### Frontend (uudet/muokattavat)

- `frontend/src/components/tax/TaxView.tsx`
- `frontend/src/components/tax/TaxSummaryCards.tsx`
- `frontend/src/components/tax/TaxBreakdown.tsx`
- `frontend/src/lib/alisa-contexts.ts` – lisää `taxContext`
- `frontend/src/components/layout/MainMenuItems.tsx` – päivitä reitti "#" → "/tax"
- `frontend/src/translations/tax/fi.ts`
- `frontend/src/translations/tax/en.ts`
- `frontend/src/App.tsx` – lisää reitti

## Verottajan vaatimukset (viite)

Suomen verottaja vaatii asuntosijoittajalta lomakkeella 7H:
- Bruttovuokratulot
- Vähennyskelpoiset kulut (hoitovastike, korjaukset, vakuutukset, matkakulut)
- Perusparannuspoistot (10% vuodessa)
- Verotettava pääomatulo

Lähteet:
- https://www.vero.fi/en/individuals/property/rental_income/deductions/
- https://asuntosalkunrakentaja.fi/asuntosijoittaminen/sijoitusasunnon-verotus/
