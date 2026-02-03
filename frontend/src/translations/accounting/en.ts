const accounting = {
  // Left menu
  accepted: "Accepted",
  pending: "Pending",
  expenses: "Expenses",
  incomes: "Incomes",

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
  delete: "Delete",
  add: "Add",

  // Format helpers
  "format.number": "{{val, number}}",
  "format.currency.euro": "{{val, number(minimumFractionDigits: 2; maximumFractionDigits: 2)}} €",
  "format.date": "{{val, datetime}}",
};

export default accounting;
