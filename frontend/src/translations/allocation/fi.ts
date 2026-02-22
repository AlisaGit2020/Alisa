const allocation = {
  // General
  rules: 'Kohdistussäännöt',
  addRule: 'Lisää sääntö',
  editRule: 'Muokkaa sääntöä',
  ruleName: 'Säännön nimi',
  noRules: 'Ei määriteltyjä sääntöjä',
  ruleNamePlaceholder: 'Syötä säännön nimi',

  // Conditions
  conditions: 'Ehdot',
  addCondition: 'Lisää ehto',
  condition: 'Ehto',
  field: 'Kenttä',
  operator: 'Operaattori',
  value: 'Arvo',

  // Fields
  'field.sender': 'Lähettäjä',
  'field.receiver': 'Vastaanottaja',
  'field.description': 'Kuvaus',
  'field.amount': 'Summa',

  // Operators
  'operator.equals': 'Yhtä kuin',
  'operator.contains': 'Sisältää',
  'operator.greaterThan': 'Suurempi kuin',
  'operator.lessThan': 'Pienempi kuin',

  // Actions
  autoAllocate: 'Automaattinen kohdistus',
  applyRules: 'Käytä sääntöjä',

  // Results
  allocated: 'Kohdistettu',
  conflicting: 'Ristiriitainen',
  noMatch: 'Ei osumaa',
  skipped: 'Ohitettu',
  loanSplitFailed: 'Lainan jako epäonnistui',
  alreadyAllocated: 'Jo kohdistettu',

  // Messages
  allocatedCount: '{{count}} tapahtumaa kohdistettu',
  conflictingCount: '{{count}} tapahtumalla on ristiriitaisia sääntöjä',
  skippedCount: '{{count}} tapahtumaa ohitettu',
  noTransactionsSelected: 'Ei valittuja tapahtumia',
  rulesApplied: 'Kohdistussäännöt käytetty',

  // Transaction type
  transactionType: 'Tapahtumatyyppi',

  // Category
  expenseType: 'Kululaji',
  incomeType: 'Tulolaji',

  // Active/Inactive
  active: 'Aktiivinen',
  inactive: 'Ei aktiivinen',

  // Priority
  priority: 'Prioriteetti',
  reorder: 'Järjestä uudelleen',
  dragToReorder: 'Vedä järjestääksesi sääntöjä uudelleen',

  // Validation
  atLeastOneCondition: 'Vähintään yksi ehto vaaditaan',
  invalidOperator: 'Virheellinen operaattori tälle kenttätyypille',
};

export default allocation;
