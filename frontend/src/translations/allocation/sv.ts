const allocation = {
  // General
  rules: 'Allokeringsregler',
  addRule: 'Lägg till regel',
  editRule: 'Redigera regel',
  ruleName: 'Regelnamn',
  noRules: 'Inga regler definierade',
  ruleNamePlaceholder: 'Ange regelnamn',

  // Conditions
  conditions: 'Villkor',
  addCondition: 'Lägg till villkor',
  condition: 'Villkor',
  field: 'Fält',
  operator: 'Operator',
  value: 'Värde',

  // Fields
  'field.sender': 'Avsändare',
  'field.receiver': 'Mottagare',
  'field.description': 'Beskrivning',
  'field.amount': 'Belopp',

  // Operators
  'operator.equals': 'Lika med',
  'operator.contains': 'Innehåller',
  'operator.greaterThan': 'Större än',
  'operator.lessThan': 'Mindre än',

  // Actions
  autoAllocate: 'Auto-allokera',
  applyRules: 'Tillämpa regler',

  // Results
  allocated: 'Allokerad',
  conflicting: 'Konflikt',
  noMatch: 'Ingen matchning',
  skipped: 'Hoppades över',
  loanSplitFailed: 'Lånedelning misslyckades',
  alreadyAllocated: 'Redan allokerad',

  // Messages
  allocatedCount: '{{count}} transaktioner allokerade',
  conflictingCount: '{{count}} transaktioner har konfliktande regler',
  skippedCount: '{{count}} transaktioner hoppades över',
  noTransactionsSelected: 'Inga transaktioner valda',
  noMatchesFound: 'Inga matchningar mot allokeringsregler',
  rulesApplied: 'Allokeringsregler tillämpade',

  // Transaction type
  transactionType: 'Transaktionstyp',

  // Category
  expenseType: 'Utgiftstyp',
  incomeType: 'Inkomsttyp',

  // Active/Inactive
  active: 'Aktiv',
  inactive: 'Inaktiv',

  // Priority
  priority: 'Prioritet',
  reorder: 'Ordna om',
  dragToReorder: 'Dra för att ordna om regler',

  // Validation
  atLeastOneCondition: 'Minst ett villkor krävs',
  invalidOperator: 'Ogiltig operator för denna fälttyp',
};

export default allocation;
