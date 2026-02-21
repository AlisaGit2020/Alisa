const accounting = {
  // Page template
  pageTitle: "Bokföring",
  pageDescription: "Få tillgång till ekonomiska rapporter och bokföringsverktyg.",

  // Page template for incomes
  incomesPageTitle: "Intäkter",
  incomesPageDescription: "Följ hyresintäkter och andra inkomster från dina fastigheter.",
  incomesPageMoreDetails: `Intäktsrader kan skapas på två sätt:
• Manuellt genom att lägga till nya intäktsposter
• Automatiskt när banktransaktioner godkänns som intäkter

Raderingsregler:
• Manuellt skapade intäktsrader kan raderas direkt
• Intäktsrader kopplade till en banktransaktion kan inte raderas separat — radera den associerade transaktionen istället`,

  // Page template for expenses
  expensesPageTitle: "Utgifter",
  expensesPageDescription: "Hantera kostnader och utgifter relaterade till dina fastigheter.",
  expensesPageMoreDetails: `Utgiftsrader kan skapas på två sätt:
• Manuellt genom att lägga till nya utgiftsposter
• Automatiskt när banktransaktioner godkänns som utgifter

Raderingsregler:
• Manuellt skapade utgiftsrader kan raderas direkt
• Utgiftsrader kopplade till en banktransaktion kan inte raderas separat — radera den associerade transaktionen istället`,

  // Left menu
  accounting: "Bokföring",
  bankTransactions: "Banktransaktioner",
  accepted: "Godkända",
  pending: "Väntande",
  expenses: "Utgifter",
  incomes: "Intäkter",

  // Overview page
  overviewTitle: "Bokföring",
  overviewDescription:
    "Hantera ekonomin för dina fastigheter. Följ utgifter, registrera intäkter och granska banktransaktioner för att hålla din bokföring i ordning.",
  expensesDescription:
    "Registrera och kategorisera fastighetsrelaterade utgifter som underhåll, reparationer och el.",
  incomesDescription:
    "Följ hyresintäkter och andra inkomster från dina fastigheter.",
  bankTransactionsDescription:
    "Granska och stäm av importerade banktransaktioner mot din bokföring.",

  // Common form fields
  accountingDate: "Bokföringsdatum",
  property: "Fastighet",
  description: "Beskrivning",
  quantity: "Antal",
  amount: "Pris",
  totalAmount: "Totalt",
  expenseType: "Utgiftstyp",
  incomeType: "Intäktstyp",

  // Form actions
  save: "Spara",
  cancel: "Avbryt",
  validationErrorTitle: "Kontrollera inmatade uppgifter",

  // Expense form
  addExpense: "Lägg till utgift",
  editExpense: "Redigera utgift",

  // Income form
  addIncome: "Lägg till intäkt",
  editIncome: "Redigera intäkt",

  // Filter
  all: "Alla",
  search: "Sök",
  reset: "Rensa",
  startDate: "Startdatum",
  endDate: "Slutdatum",
  dataNotSelected: "Ej valt",
  activeFilters: "Aktiva filter",

  // Data table
  rowCount_one: "{{count}} rad",
  rowCount_other: "{{count}} rader",
  noRowsFound: "Inga rader",
  confirm: "Bekräfta",
  confirmDelete: "Vill du verkligen ta bort?",
  confirmDeleteExpense: "Vill du verkligen ta bort denna utgift?",
  confirmDeleteIncome: "Vill du verkligen ta bort denna intäkt?",
  delete: "Ta bort",
  add: "Lägg till",

  // Bulk delete with transaction warnings
  cannotDeleteWithTransaction: "Kan inte radera objekt",
  someItemsHaveTransactions:
    "{{count}} objekt har en transaktionskoppling och kan inte raderas direkt. Radera transaktionen istället. Vill du radera de återstående {{deletableCount}} objekten?",
  allItemsHaveTransactions:
    "Alla {{count}} valda objekt har en transaktionskoppling. För att radera dessa, radera den associerade transaktionen istället.",
  singleItemHasTransaction:
    "Detta objekt har en transaktionskoppling och kan inte raderas direkt. För att radera detta objekt, radera den associerade transaktionen istället.",
  noItemsToDelete: "Inga objekt att radera",

  // Format helpers
  "format.number": "{{val, number}}",
  "format.currency.euro": "{{val, number(minimumFractionDigits: 2; maximumFractionDigits: 2)}} €",
  "format.date": "{{val, datetime}}",
};

export default accounting;
