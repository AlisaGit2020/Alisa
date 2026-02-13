const investmentCalculator = {
  title: 'Investment Calculator',
  pageTitle: 'Investment Calculator',
  pageDescription: 'Calculate your investment property profitability for free and compare different options. Save your calculations and track the performance of your investments.',
  subtitle: 'Calculate your investment property profitability for free',
  newCalculation: 'New Calculation',
  savedCalculations: 'Saved Calculations',
  calculate: 'Calculate',
  save: 'Save',
  saveSuccess: 'Calculation saved successfully',
  mustLoginToSave: 'Log in to save calculations',

  // Form section headers
  sectionPropertyDetails: 'Property Details',
  sectionMonthlyCosts: 'Monthly Costs',
  sectionRentalIncome: 'Rental Income',
  sectionFinancing: 'Financing',

  // Input fields
  name: 'Calculation name',
  deptFreePrice: 'Debt-free price',
  deptShare: 'Share of company loan',
  transferTaxPercent: 'Transfer tax (%)',
  maintenanceFee: 'Maintenance fee (€/month)',
  chargeForFinancialCosts: 'Financial charge (€/month)',
  rentPerMonth: 'Rent (€/month)',
  apartmentSize: 'Apartment size (m²)',
  waterCharge: 'Water charge (€/month)',
  downPayment: 'Down payment (€)',
  loanInterestPercent: 'Loan interest (%)',
  loanPeriod: 'Loan period (years)',

  // Result section headers
  purchaseCosts: 'Purchase costs',
  loanDetails: 'Loan details',
  incomeAndExpenses: 'Income and expenses',
  returns: 'Returns',

  // Result fields - Purchase costs
  sellingPrice: 'Purchase price',
  transferTax: 'Transfer tax',
  pricePerSquareMeter: 'Price per m²',

  // Result fields - Loan details
  loanFinancing: 'Loan amount',
  loanFirstMonthInstallment: 'Principal 1st month',
  loanFirstMonthInterest: 'Interest 1st month',

  // Result fields - Income & Expenses
  rentalIncomePerYear: 'Rental income/year',
  maintenanceCosts: 'Maintenance costs/year',
  expensesPerMonth: 'Total expenses/month',

  // Result fields - Returns
  rentalYieldPercent: 'Gross yield %',
  cashFlowPerMonth: 'Cash flow/month',
  cashFlowAfterTaxPerMonth: 'Cash flow after tax/month',
  profitPerYear: 'Profit/year',
  taxPerYear: 'Taxes/year',
  taxDeductibleExpensesPerYear: 'Deductible expenses/year',

  // Etuovi import
  etuoviUrl: 'Etuovi.com URL',
  fetchFromEtuovi: 'Fetch data',
  fetchSuccess: 'Property data loaded',
  fetchError: 'Could not fetch property data',
  invalidUrl: 'Invalid etuovi.com URL',

  // Saved calculations
  createdAt: 'Created',
  associatedProperty: 'Property',
  actions: 'Actions',
  view: 'View',
  edit: 'Edit',
  delete: 'Delete',
  associate: 'Associate with property',
  deleteConfirm: 'Are you sure you want to delete this calculation?',
  noCalculations: 'No saved calculations',
  calculation: 'Calculation',

  // Bulk actions
  rowsSelected: '{{count}} calculation selected',
  rowsSelected_other: '{{count}} calculations selected',
  confirmDeleteSelected: 'Are you sure you want to delete {{count}} calculation?',
  confirmDeleteSelected_other: 'Are you sure you want to delete {{count}} calculations?',
  deleteAriaLabel: 'Delete {{count}} selected calculation',
  deleteAriaLabel_other: 'Delete {{count}} selected calculations',
}

export default investmentCalculator
