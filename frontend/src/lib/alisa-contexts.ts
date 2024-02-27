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

export const expenseTypeContext: AlisaContext = {
    name: 'expense-type',
    apiPath: 'accounting/expense/type',
    routePath: '/settings/expense-types',
}

export const expenseContext: AlisaContext = {
    name: 'expense',
    apiPath: 'accounting/expense',
    routePath: '/transactions',
}

export const incomeTypeContext: AlisaContext = {
    name: 'income-type',
    apiPath: 'accounting/income/type',
    routePath: '/settings',
}

export const incomeContext: AlisaContext = {
    name: 'income',
    apiPath: 'accounting/income',
    routePath: '/transactions',
}

export const opImportContext: AlisaContext = {
    name: 'op-import',
    apiPath: 'import/op',
    routePath: '/transactions/import/op',
}

export const settingsContext: AlisaContext = {
    name: 'settings',
    apiPath: '',
    routePath: '/settings',
}

export const transactionContext: AlisaContext = {
    name: 'transaction',
    apiPath: 'accounting/transaction',
    routePath: '/transactions',
}
