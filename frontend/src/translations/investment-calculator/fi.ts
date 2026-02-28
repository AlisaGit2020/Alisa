const investmentCalculator = {
  title: 'Sijoitustuottolaskuri',
  pageTitle: 'Sijoitustuottolaskuri',
  pageDescription: 'Laske sijoitusasuntosi kannattavuus ja vertaile eri vaihtoehtoja. Tallenna laskelmat ja seuraa sijoitustesi kehitystä.',
  subtitle: 'Laske sijoitusasuntosi kannattavuus ilmaiseksi',
  newCalculation: 'Uusi laskenta',
  savedCalculations: 'Tallennetut laskelmat',
  calculate: 'Laske',
  save: 'Tallenna',
  saveSuccess: 'Laskenta tallennettu onnistuneesti',
  mustLoginToSave: 'Kirjaudu sisään tallentaaksesi laskelman',

  // Form section headers
  sectionPropertyDetails: 'Asunnon tiedot',
  sectionMonthlyCosts: 'Kuukausikulut',
  sectionRentalIncome: 'Vuokratuotto',
  sectionFinancing: 'Rahoitus',

  // Input fields
  name: 'Laskelman nimi',
  deptFreePrice: 'Velaton hinta',
  deptShare: 'Yhtiölainaosuus',
  transferTaxPercent: 'Varainsiirtovero (%)',
  maintenanceFee: 'Hoitovastike (€/kk)',
  chargeForFinancialCosts: 'Rahoitusvastike (€/kk)',
  rentPerMonth: 'Vuokra (€/kk)',
  apartmentSize: 'Asunnon koko (m²)',
  waterCharge: 'Vesimaksu (€/kk)',
  downPayment: 'Käsiraha (€)',
  loanInterestPercent: 'Lainan korko (%)',
  loanPeriod: 'Laina-aika (vuotta)',

  // Result section headers
  purchaseCosts: 'Hankintakulut',
  loanDetails: 'Lainatiedot',
  incomeAndExpenses: 'Tulot ja kulut',
  returns: 'Tuotto',

  // Result fields - Purchase costs
  sellingPrice: 'Kauppahinta',
  transferTax: 'Varainsiirtovero',
  pricePerSquareMeter: 'Hinta per m²',

  // Result fields - Loan details
  loanFinancing: 'Lainan määrä',
  loanFirstMonthInstallment: 'Lyhennys 1. kk',
  loanFirstMonthInterest: 'Korko 1. kk',

  // Result fields - Income & Expenses
  rentalIncomePerYear: 'Vuokratulot/vuosi',
  maintenanceCosts: 'Hoitokulut/vuosi',
  expensesPerMonth: 'Kulut yhteensä/kk',

  // Result fields - Returns
  rentalYieldPercent: 'Bruttotuotto-%',
  cashFlowPerMonth: 'Kassavirta/kk',
  cashFlowAfterTaxPerMonth: 'Kassavirta verojen jälkeen/kk',
  profitPerYear: 'Voitto/vuosi',
  taxPerYear: 'Verot/vuosi',
  taxDeductibleExpensesPerYear: 'Vähennyskelpoiset kulut/vuosi',

  // Etuovi import
  etuoviUrl: 'Etuovi.com -linkki',
  fetchFromEtuovi: 'Hae tiedot',
  fetchSuccess: 'Asunnon tiedot ladattu',
  fetchError: 'Tietojen haku epäonnistui',
  invalidUrl: 'Virheellinen etuovi.com -osoite',

  // Saved calculations
  createdAt: 'Luotu',
  associatedProperty: 'Asunto',
  actions: 'Toiminnot',
  view: 'Näytä',
  edit: 'Muokkaa',
  delete: 'Poista',
  associate: 'Liitä asuntoon',
  deleteConfirm: 'Haluatko varmasti poistaa laskelman?',
  noCalculations: 'Ei tallennettuja laskelmia',
  calculation: 'Laskelma',

  // Bulk actions
  rowsSelected: '{{count}} laskelma valittu',
  rowsSelected_other: '{{count}} laskelmaa valittu',
  confirmDeleteSelected: 'Haluatko varmasti poistaa {{count}} laskelman?',
  confirmDeleteSelected_other: 'Haluatko varmasti poistaa {{count}} laskelmaa?',
  deleteAriaLabel: 'Poista {{count}} valittu laskelma',
  deleteAriaLabel_other: 'Poista {{count}} valittua laskelmaa',

  // Prospect Compare View
  prospectCompare: 'Vertaa kohteita',
  calculations: 'Laskelmat',
  comparison: 'Vertailu',
  loading: 'Ladataan...',
  errorLoading: 'Laskelmien lataus epaonnistui',
  noCalculationsMessage: 'Luo laskelmia vertaillaksesi sijoitusmahdollisuuksia',
  unlinkedCalculations: 'Ilman kohdetta',
  maxCalculationsWarning: 'Enintaan 5 laskelmaa voidaan vertailla kerralla',
  duplicateWarning: 'Tama laskelma on jo vertailussa',
  dropHereToCompare: 'Pudota tahan vertaillaksesi',
  emptyComparisonMessage: 'Valitse laskelmia listasta vertailtavaksi',
  removeFromComparison: 'Poista vertailusta',
  unlinkedProperty: 'Ei liitetyä kohdetta',
  rentalYield: 'Vuokratuotto',
}

export default investmentCalculator
