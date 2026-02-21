const accounting = {
  // Page template
  pageTitle: "Kirjanpito",
  pageDescription: "Pääsy talousraportteihin ja kirjanpitotyökaluihin.",

  // Page template for incomes
  incomesPageTitle: "Tulot",
  incomesPageDescription: "Seuraa vuokratuloja ja muita kiinteistöjesi tuottoja.",
  incomesPageMoreDetails: `Tulorivejä voi luoda kahdella tavalla:
• Manuaalisesti lisäämällä uusia tuloja
• Automaattisesti hyväksymällä pankkitapahtumia tuloiksi

Poistosäännöt:
• Manuaalisesti luodut tulorivit voi poistaa suoraan
• Pankkitapahtumaan liitettyjä tulorivejä ei voi poistaa erikseen — poista sen sijaan liitetty tapahtuma`,

  // Page template for expenses
  expensesPageTitle: "Kulut",
  expensesPageDescription: "Hallitse kiinteistöihisi liittyviä kustannuksia ja kuluja.",
  expensesPageMoreDetails: `Kulurivejä voi luoda kahdella tavalla:
• Manuaalisesti lisäämällä uusia kuluja
• Automaattisesti hyväksymällä pankkitapahtumia kuluiksi

Poistosäännöt:
• Manuaalisesti luodut kulurivit voi poistaa suoraan
• Pankkitapahtumaan liitettyjä kulurivejä ei voi poistaa erikseen — poista sen sijaan liitetty tapahtuma`,

  // Left menu
  accounting: "Kirjanpito",
  bankTransactions: "Pankkitapahtumat",
  accepted: "Hyväksytyt",
  pending: "Odottaa",
  expenses: "Kulut",
  incomes: "Tulot",

  // Overview page
  overviewTitle: "Kirjanpito",
  overviewDescription:
    "Hallitse kiinteistöjesi taloutta. Seuraa kuluja, kirjaa tuloja ja tarkista pankkitapahtumat pitääksesi kirjanpitosi järjestyksessä ja ajan tasalla.",
  expensesDescription:
    "Kirjaa ja luokittele kiinteistöihin liittyvät kulut, kuten huolto, korjaukset ja sähköt.",
  incomesDescription:
    "Seuraa vuokratuloja ja muita kiinteistöistäsi saatavia tuloja.",
  bankTransactionsDescription:
    "Tarkista ja täsmäytä tuodut pankkitapahtumat kirjanpitotietoihisi.",

  // Common form fields
  accountingDate: "Kirjanpito pvm",
  property: "Asunto",
  description: "Kuvaus",
  quantity: "Määrä",
  amount: "Hinta",
  totalAmount: "Yhteensä",
  expenseType: "Kululaji",
  incomeType: "Tulolaji",

  // Form actions
  save: "Tallenna",
  cancel: "Peruuta",
  validationErrorTitle: "Tarkista syötetyt tiedot",

  // Expense form
  addExpense: "Lisää kulu",
  editExpense: "Muokkaa kulua",

  // Income form
  addIncome: "Lisää tulo",
  editIncome: "Muokkaa tuloa",

  // Filter
  all: "Kaikki",
  search: "Haku",
  reset: "Tyhjennä",
  startDate: "Alkupäivä",
  endDate: "Loppupäivä",
  dataNotSelected: "Ei valittu",
  activeFilters: "Aktiiviset suodattimet",

  // Data table
  rowCount_one: "{{count}} rivi",
  rowCount_other: "{{count}} riviä",
  noRowsFound: "Ei rivejä",
  confirm: "Vahvista",
  confirmDelete: "Haluatko varmasti poistaa?",
  confirmDeleteExpense: "Haluatko varmasti poistaa tämän kulun?",
  confirmDeleteIncome: "Haluatko varmasti poistaa tämän tulon?",
  delete: "Poista",
  add: "Lisää",

  // Bulk delete with transaction warnings
  cannotDeleteWithTransaction: "Kohdetta ei voi poistaa",
  someItemsHaveTransactions:
    "{{count}} kohdetta on liitetty tapahtumaan eikä niitä voi poistaa suoraan. Poista tapahtuma ensin. Haluatko poistaa loput {{deletableCount}} kohdetta?",
  allItemsHaveTransactions:
    "Kaikki {{count}} valittua kohdetta on liitetty tapahtumaan. Poista tapahtuma ensin.",
  singleItemHasTransaction:
    "Tämä kohde on liitetty tapahtumaan eikä sitä voi poistaa suoraan. Poista tapahtuma ensin.",
  noItemsToDelete: "Ei poistettavia kohteita",
  editNotAllowed:
    "Tämä kohde on liitetty pankkitapahtumaan eikä sitä voi muokata. Muokataksesi tätä kohdetta, muokkaa tai poista liitetty tapahtuma.",

  // Format helpers
  "format.number": "{{val, number}}",
  "format.currency.euro": "{{val, number(minimumFractionDigits: 2; maximumFractionDigits: 2)}} €",
  "format.date": "{{val, datetime}}",
};

export default accounting;
