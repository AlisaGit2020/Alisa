const allocation = {
  // General
  rules: 'Allocation Rules',
  addRule: 'Add Rule',
  editRule: 'Edit Rule',
  ruleName: 'Rule Name',
  noRules: 'No rules defined',
  ruleNamePlaceholder: 'Enter rule name',

  // Conditions
  conditions: 'Conditions',
  addCondition: 'Add Condition',
  condition: 'Condition',
  field: 'Field',
  operator: 'Operator',
  value: 'Value',

  // Fields
  'field.sender': 'Sender',
  'field.receiver': 'Receiver',
  'field.description': 'Description',
  'field.amount': 'Amount',

  // Operators
  'operator.equals': 'Equals',
  'operator.contains': 'Contains',
  'operator.greaterThan': 'Greater than',
  'operator.lessThan': 'Less than',

  // Actions
  autoAllocate: 'Auto-Allocate',
  applyRules: 'Apply Rules',

  // Results
  allocated: 'Allocated',
  conflicting: 'Conflicting',
  noMatch: 'No Match',
  skipped: 'Skipped',
  loanSplitFailed: 'Loan split failed',
  alreadyAllocated: 'Already allocated',

  // Messages
  allocatedCount: '{{count}} transactions allocated',
  conflictingCount: '{{count}} transactions have conflicting rules',
  skippedCount: '{{count}} transactions skipped',
  noTransactionsSelected: 'No transactions selected',
  rulesApplied: 'Allocation rules applied',

  // Transaction type
  transactionType: 'Transaction Type',

  // Category
  expenseType: 'Expense Type',
  incomeType: 'Income Type',

  // Active/Inactive
  active: 'Active',
  inactive: 'Inactive',

  // Priority
  priority: 'Priority',
  reorder: 'Reorder',
  dragToReorder: 'Drag to reorder rules',

  // Validation
  atLeastOneCondition: 'At least one condition is required',
  invalidOperator: 'Invalid operator for this field type',
};

export default allocation;
