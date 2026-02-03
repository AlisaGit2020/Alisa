type AlisaContext = {
    name: string
    apiPath: string
    routePath: string
}

export default AlisaContext

export const propertyContext: AlisaContext = {
    name: 'property',
    apiPath: 'real-estate/property',
    routePath: '/properties',
}

export const accountingContext: AlisaContext = {
    name: 'accounting',
    apiPath: 'accounting',
    routePath: '/accounting',
}

export const expenseTypeContext: AlisaContext = {
    name: 'expense-type',
    apiPath: 'accounting/expense/type',
    routePath: '/settings/expense-types',
}

export const expenseContext: AlisaContext = {
    name: 'expense',
    apiPath: 'accounting/expense',
    routePath: '/accounting/expenses',
}

export const incomeTypeContext: AlisaContext = {
    name: 'income-type',
    apiPath: 'accounting/income/type',
    routePath: '/settings/income-types',
}

export const incomeContext: AlisaContext = {
    name: 'income',
    apiPath: 'accounting/income',
    routePath: '/accounting/incomes',
}

export const loginContext: AlisaContext = {
    name: 'login',
    apiPath: 'auth',
    routePath: '/login',
}

export const opImportContext: AlisaContext = {
    name: 'op-import',
    apiPath: 'import/op',
    routePath: '/accounting/transactions/import/op',
}

export const settingsContext: AlisaContext = {
    name: 'settings',
    apiPath: '',
    routePath: '/settings',
}

export const transactionContext: AlisaContext = {
    name: 'transaction',
    apiPath: 'accounting/transaction',
    routePath: '/accounting/transactions',
}

export const userContext: AlisaContext = {
    name: 'user',
    apiPath: 'auth',
    routePath: '/',
}

export const dashboardContext: AlisaContext = {
    name: 'dashboard',
    apiPath: 'real-estate/property',
    routePath: '/',
}
