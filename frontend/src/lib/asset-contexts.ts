type AssetContext = {
    name: string
    apiPath: string
    routePath: string
}

export default AssetContext

export const adminContext: AssetContext = {
    name: 'admin',
    apiPath: 'admin',
    routePath: '/app/admin',
}

export const propertyContext: AssetContext = {
    name: 'property',
    apiPath: 'real-estate/property',
    routePath: '/app/portfolio',
}

export const financeContext: AssetContext = {
    name: 'finance',
    apiPath: 'accounting',
    routePath: '/app/finance',
}

// Backward compatibility alias
export const accountingContext = financeContext

export const expenseTypeContext: AssetContext = {
    name: 'expense-type',
    apiPath: 'accounting/expense/type',
    routePath: '/app/settings/expense-types',
}

export const expenseContext: AssetContext = {
    name: 'expense',
    apiPath: 'accounting/expense',
    routePath: '/app/finance/expenses',
}

export const incomeTypeContext: AssetContext = {
    name: 'income-type',
    apiPath: 'accounting/income/type',
    routePath: '/app/settings/income-types',
}

export const incomeContext: AssetContext = {
    name: 'income',
    apiPath: 'accounting/income',
    routePath: '/app/finance/incomes',
}

export const loginContext: AssetContext = {
    name: 'login',
    apiPath: 'auth',
    routePath: '/login',
}

export const opImportContext: AssetContext = {
    name: 'op-import',
    apiPath: 'import/op',
    routePath: '/app/finance/transactions/import/op',
}

export const sPankkiImportContext: AssetContext = {
    name: 's-pankki-import',
    apiPath: 'import/s-pankki',
    routePath: '/app/finance/transactions/import/s-pankki',
}

export const settingsContext: AssetContext = {
    name: 'settings',
    apiPath: '',
    routePath: '/app/settings',
}

export const transactionContext: AssetContext = {
    name: 'transaction',
    apiPath: 'accounting/transaction',
    routePath: '/app/finance/transactions',
}

export const userContext: AssetContext = {
    name: 'user',
    apiPath: 'auth',
    routePath: '/app',
}

export const dashboardContext: AssetContext = {
    name: 'dashboard',
    apiPath: 'real-estate/property',
    routePath: '/app/dashboard',
}

export const portfolioContext: AssetContext = {
    name: 'portfolio',
    apiPath: 'real-estate/property',
    routePath: '/app/portfolio',
}

export const reportsContext: AssetContext = {
    name: 'reports',
    apiPath: 'real-estate/property',
    routePath: '/app/reports',
}

export const taxContext: AssetContext = {
    name: 'tax',
    apiPath: 'real-estate/property/tax',
    routePath: '/app/reports/tax',
}

export const reportContext: AssetContext = {
    name: 'report',
    apiPath: 'real-estate/property',
    routePath: '/app/reports/property',
}

export const investmentCalculationContext: AssetContext = {
    name: 'investment-calculator',
    apiPath: 'real-estate/investment',
    routePath: '/app/investment-calculator',
}
