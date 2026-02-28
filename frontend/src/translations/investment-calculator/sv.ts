const investmentCalculator = {
  title: 'Investeringskalkylator',
  pageTitle: 'Investeringskalkylator',
  pageDescription: 'Beräkna lönsamheten för din investeringsbostad och jämför olika alternativ. Spara beräkningar och följ utvecklingen av dina investeringar.',
  subtitle: 'Beräkna lönsamheten för din investeringsbostad gratis',
  newCalculation: 'Ny beräkning',
  savedCalculations: 'Sparade beräkningar',
  calculate: 'Beräkna',
  save: 'Spara',
  saveSuccess: 'Beräkning sparad',
  mustLoginToSave: 'Logga in för att spara beräkningen',

  // Form section headers
  sectionPropertyDetails: 'Fastighetsdetaljer',
  sectionMonthlyCosts: 'Månadskostnader',
  sectionRentalIncome: 'Hyresintäkter',
  sectionFinancing: 'Finansiering',

  // Input fields
  name: 'Beräkningens namn',
  deptFreePrice: 'Skuldfritt pris',
  deptShare: 'Bostadsrättsföreningslån',
  transferTaxPercent: 'Stämpelskatt (%)',
  maintenanceFee: 'Månadsavgift (€/mån)',
  chargeForFinancialCosts: 'Finansieringsavgift (€/mån)',
  rentPerMonth: 'Hyra (€/mån)',
  apartmentSize: 'Bostadens storlek (m²)',
  waterCharge: 'Vattenavgift (€/mån)',
  downPayment: 'Kontantinsats (€)',
  loanInterestPercent: 'Låneränta (%)',
  loanPeriod: 'Lånetid (år)',

  // Result section headers
  purchaseCosts: 'Förvärvskostnader',
  loanDetails: 'Lånedetaljer',
  incomeAndExpenses: 'Intäkter och utgifter',
  returns: 'Avkastning',

  // Result fields - Purchase costs
  sellingPrice: 'Köpeskilling',
  transferTax: 'Stämpelskatt',
  pricePerSquareMeter: 'Pris per m²',

  // Result fields - Loan details
  loanFinancing: 'Lånebelopp',
  loanFirstMonthInstallment: 'Amortering 1:a mån',
  loanFirstMonthInterest: 'Ränta 1:a mån',

  // Result fields - Income & Expenses
  rentalIncomePerYear: 'Hyresintäkter/år',
  maintenanceCosts: 'Driftskostnader/år',
  expensesPerMonth: 'Totala kostnader/mån',

  // Result fields - Returns
  rentalYieldPercent: 'Bruttoavkastning %',
  cashFlowPerMonth: 'Kassaflöde/mån',
  cashFlowAfterTaxPerMonth: 'Kassaflöde efter skatt/mån',
  profitPerYear: 'Vinst/år',
  taxPerYear: 'Skatt/år',
  taxDeductibleExpensesPerYear: 'Avdragsgilla kostnader/år',

  // Etuovi import
  etuoviUrl: 'Etuovi.com URL',
  fetchFromEtuovi: 'Hämta data',
  fetchSuccess: 'Fastighetsdata laddad',
  fetchError: 'Kunde inte hämta fastighetsdata',
  invalidUrl: 'Ogiltig etuovi.com URL',

  // Saved calculations
  createdAt: 'Skapad',
  associatedProperty: 'Fastighet',
  actions: 'Åtgärder',
  view: 'Visa',
  edit: 'Redigera',
  delete: 'Ta bort',
  associate: 'Koppla till fastighet',
  deleteConfirm: 'Vill du verkligen ta bort beräkningen?',
  noCalculations: 'Inga sparade beräkningar',
  calculation: 'Beräkning',

  // Bulk actions
  rowsSelected: '{{count}} beräkning vald',
  rowsSelected_other: '{{count}} beräkningar valda',
  confirmDeleteSelected: 'Vill du verkligen ta bort {{count}} beräkning?',
  confirmDeleteSelected_other: 'Vill du verkligen ta bort {{count}} beräkningar?',
  deleteAriaLabel: 'Ta bort {{count}} vald beräkning',
  deleteAriaLabel_other: 'Ta bort {{count}} valda beräkningar',

  // Prospect Compare View
  prospectCompare: 'Jämför prospekt',
  calculations: 'Beräkningar',
  comparison: 'Jämförelse',
  loading: 'Laddar...',
  errorLoading: 'Fel vid laddning av beräkningar',
  noCalculationsMessage: 'Skapa beräkningar för att jämföra investeringsmöjligheter',
  unlinkedCalculations: 'Olänkade',
  maxCalculationsWarning: 'Maximalt 5 beräkningar kan jämföras samtidigt',
  duplicateWarning: 'Denna beräkning finns redan i jämförelsen',
  dropHereToCompare: 'Släpp här för att jämföra',
  emptyComparisonMessage: 'Välj beräkningar från listan för att jämföra',
  removeFromComparison: 'Ta bort från jämförelse',
  unlinkedProperty: 'Ingen fastighet länkad',
  rentalYield: 'Hyresavkastning',
}

export default investmentCalculator
