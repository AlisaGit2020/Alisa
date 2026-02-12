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
    routePath: '/app/properties',
}

export const accountingContext: AlisaContext = {
    name: 'accounting',
    apiPath: 'accounting',
    routePath: '/app/accounting',
}

export const expenseTypeContext: AlisaContext = {
    name: 'expense-type',
    apiPath: 'accounting/expense/type',
    routePath: '/app/settings/expense-types',
}

export const expenseContext: AlisaContext = {
    name: 'expense',
    apiPath: 'accounting/expense',
    routePath: '/app/accounting/expenses',
}

export const incomeTypeContext: AlisaContext = {
    name: 'income-type',
    apiPath: 'accounting/income/type',
    routePath: '/app/settings/income-types',
}

export const incomeContext: AlisaContext = {
    name: 'income',
    apiPath: 'accounting/income',
    routePath: '/app/accounting/incomes',
}

export const loginContext: AlisaContext = {
    name: 'login',
    apiPath: 'auth',
    routePath: '/login',
}

export const opImportContext: AlisaContext = {
    name: 'op-import',
    apiPath: 'import/op',
    routePath: '/app/accounting/transactions/import/op',
}

export const sPankkiImportContext: AlisaContext = {
    name: 's-pankki-import',
    apiPath: 'import/s-pankki',
    routePath: '/app/accounting/transactions/import/s-pankki',
}

export const settingsContext: AlisaContext = {
    name: 'settings',
    apiPath: '',
    routePath: '/app/settings',
}

export const transactionContext: AlisaContext = {
    name: 'transaction',
    apiPath: 'accounting/transaction',
    routePath: '/app/accounting/transactions',
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

export const taxContext: AlisaContext = {
    name: 'tax',
    apiPath: 'real-estate/property/tax',
    routePath: '/app/tax',
}

export const reportContext: AlisaContext = {
    name: 'report',
    apiPath: 'real-estate/property',
    routePath: '/app/report',
}
