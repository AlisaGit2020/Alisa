type AlisaContext = {
    name: string
    apiPath: string
    routePath: string
}

export default AlisaContext

export const apartmentContext: AlisaContext = {
    name: 'apartment',
    apiPath: 'real-estate/property',
    routePath: '/apartments',
}

export const expenseTypeContext: AlisaContext = {
    name: 'expense-type',
    apiPath: 'accounting/expense/type',
    routePath: '/settings',
}

export const expenseContext: AlisaContext = {
    name: 'expense',
    apiPath: 'accounting/expense',
    routePath: '/transactions',
}

export const transactionContext: AlisaContext = {
    name: 'transaction',
    apiPath: 'accounting/transaction',
    routePath: '/transactions',
}
