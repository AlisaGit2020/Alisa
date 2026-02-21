const accounting = {
  // Page template
  pageTitle: "Accounting",
  pageDescription: "Access financial reports and accounting tools.",

  // Page template for incomes
  incomesPageTitle: "Incomes",
  incomesPageDescription: "Track rental income and other revenue from your properties.",
  incomesPageMoreDetails: `Income rows can be created in two ways:
• Manually by adding new income entries
• Automatically when accepting bank transactions as income

Deletion rules:
• Manually created income rows can be deleted directly
• Income rows linked to a bank transaction cannot be deleted separately — delete the associated transaction instead`,

  // Page template for expenses
  expensesPageTitle: "Expenses",
  expensesPageDescription: "Manage costs and expenses related to your properties.",
  expensesPageMoreDetails: `Expense rows can be created in two ways:
• Manually by adding new expense entries
• Automatically when accepting bank transactions as expenses

Deletion rules:
• Manually created expense rows can be deleted directly
• Expense rows linked to a bank transaction cannot be deleted separately — delete the associated transaction instead`,

  // Left menu
  accounting: "Accounting",
  bankTransactions: "Bank transactions",
  accepted: "Accepted",
  pending: "Pending",
  expenses: "Expenses",
  incomes: "Incomes",

  // Overview page
  overviewTitle: "Accounting",
  overviewDescription:
    "Manage your property finances. Track expenses, record income, and review bank transactions to keep your bookkeeping organized and up-to-date.",
  expensesDescription:
    "Record and categorize property-related expenses such as maintenance, repairs, and utilities.",
  incomesDescription:
    "Track rental income and other revenue sources from your properties.",
  bankTransactionsDescription:
    "Review and reconcile imported bank transactions with your accounting records.",

  // Common form fields
  accountingDate: "Accounting Date",
  property: "Property",
  description: "Description",
  quantity: "Quantity",
  amount: "Price",
  totalAmount: "Total",
  expenseType: "Expense Type",
  incomeType: "Income Type",

  // Form actions
  save: "Save",
  cancel: "Cancel",
  validationErrorTitle: "Please check the entered information",

  // Expense form
  addExpense: "Add Expense",
  editExpense: "Edit Expense",

  // Income form
  addIncome: "Add Income",
  editIncome: "Edit Income",

  // Filter
  all: "All",
  search: "Search",
  reset: "Reset",
  startDate: "Start Date",
  endDate: "End Date",
  dataNotSelected: "Not selected",
  activeFilters: "Active filters",

  // Data table
  rowCount_one: "{{count}} row",
  rowCount_other: "{{count}} rows",
  noRowsFound: "No rows found",
  confirm: "Confirm",
  confirmDelete: "Are you sure you want to delete?",
  confirmDeleteExpense: "Are you sure you want to delete this expense?",
  confirmDeleteIncome: "Are you sure you want to delete this income?",
  delete: "Delete",
  add: "Add",

  // Bulk delete with transaction warnings
  cannotDeleteWithTransaction: "Cannot delete item",
  someItemsHaveTransactions:
    "{{count}} item(s) have a transaction relation and cannot be deleted directly. Delete the transaction instead. Do you want to delete the {{deletableCount}} remaining item(s)?",
  allItemsHaveTransactions:
    "All {{count}} selected item(s) have a transaction relation. To delete these, please delete the associated transaction instead.",
  singleItemHasTransaction:
    "This item has a transaction relation and cannot be deleted directly. To delete this item, please delete the associated transaction instead.",
  noItemsToDelete: "No items available to delete",
  editNotAllowed:
    "This item is linked to a bank transaction and cannot be edited. To modify this item, edit or delete the associated transaction instead.",

  // Format helpers
  "format.number": "{{val, number}}",
  "format.currency.euro": "{{val, number(minimumFractionDigits: 2; maximumFractionDigits: 2)}} €",
  "format.date": "{{val, datetime}}",
};

export default accounting;
