type AlisaContext = {
    name: string
    apiPath: string
    routePath: string
}

export default AlisaContext

export const adminContext: AlisaContext = {
    name: 'admin',
    apiPath: 'admin',
    routePath: '/app/admin',
}

export const propertyContext: AlisaContext = {
    name: 'property',
    apiPath: 'real-estate/property',
    routePath: '/app/portfolio/properties',
}

export const financeContext: AlisaContext = {
    name: 'finance',
    apiPath: 'accounting',
    routePath: '/app/finance',
}

// Backward compatibility alias
export const accountingContext = financeContext

export const expenseTypeContext: AlisaContext = {
    name: 'expense-type',
    apiPath: 'accounting/expense/type',
    routePath: '/app/settings/expense-types',
}

export const expenseContext: AlisaContext = {
    name: 'expense',
    apiPath: 'accounting/expense',
    routePath: '/app/finance/expenses',
}

export const incomeTypeContext: AlisaContext = {
    name: 'income-type',
    apiPath: 'accounting/income/type',
    routePath: '/app/settings/income-types',
}

export const incomeContext: AlisaContext = {
    name: 'income',
    apiPath: 'accounting/income',
    routePath: '/app/finance/incomes',
}

export const loginContext: AlisaContext = {
    name: 'login',
    apiPath: 'auth',
    routePath: '/login',
}

export const opImportContext: AlisaContext = {
    name: 'op-import',
    apiPath: 'import/op',
    routePath: '/app/finance/transactions/import/op',
}

export const sPankkiImportContext: AlisaContext = {
    name: 's-pankki-import',
    apiPath: 'import/s-pankki',
    routePath: '/app/finance/transactions/import/s-pankki',
}

export const settingsContext: AlisaContext = {
    name: 'settings',
    apiPath: '',
    routePath: '/app/settings',
}

export const transactionContext: AlisaContext = {
    name: 'transaction',
    apiPath: 'accounting/transaction',
    routePath: '/app/finance/transactions',
}

export const userContext: AlisaContext = {
    name: 'user',
    apiPath: 'auth',
    routePath: '/app',
}

export const dashboardContext: AlisaContext = {
    name: 'dashboard',
    apiPath: 'real-estate/property',
    routePath: '/app/dashboard',
}

export const portfolioContext: AlisaContext = {
    name: 'portfolio',
    apiPath: 'real-estate/property',
    routePath: '/app/portfolio',
}

export const reportsContext: AlisaContext = {
    name: 'reports',
    apiPath: 'real-estate/property',
    routePath: '/app/reports',
}

export const taxContext: AlisaContext = {
    name: 'tax',
    apiPath: 'real-estate/property/tax',
    routePath: '/app/reports/tax',
}

export const reportContext: AlisaContext = {
    name: 'report',
    apiPath: 'real-estate/property',
    routePath: '/app/reports/property',
}
