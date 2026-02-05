const investmentCalculator = {
  title: 'Sijoitustuottolaskuri',
  pageTitle: 'Sijoitustuottolaskuri',
  pageDescription: 'Laske sijoitusasuntosi kannattavuus ja vertaile eri vaihtoehtoja. Tallenna laskelmat ja seuraa sijoitustesi kehitystä.',
  newCalculation: 'Uusi laskenta',
  savedCalculations: 'Tallennetut laskelmat',
  calculate: 'Laske',
  save: 'Tallenna',
  saveSuccess: 'Laskenta tallennettu onnistuneesti',
  mustLoginToSave: 'Kirjaudu sisään tallentaaksesi laskelman',

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
}

export default investmentCalculator
