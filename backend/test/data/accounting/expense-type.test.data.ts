
import { TestData } from "../test-data";
import { ExpenseInputDto } from "src/accounting/expense/dtos/expense-input.dto";
import { ExpenseTypeInputDto } from "src/accounting/expense/dtos/expense-type-input.dto";
import { TransactionInputDto } from "src/accounting/transaction/dtos/transaction-input.dto";


export const expenseTypeTestData = {
    name: 'Expense type',
    tables: ['expense_type'],
    baseUrl: '/accounting/expense/type',
    baseUrlWithId: '/accounting/expense/type/1',

    inputPost: {
        name: 'Lainan korko',
        description: 'Pankkilaina lyhennyksen koron osuus',
        isTaxDeductible: true
    } as ExpenseTypeInputDto,

    inputPut: {
        id: 1,
        name: 'Lainan lyhennys',
        description: 'Pankkilaina lyhennyksen lainan lyhennys',
        isTaxDeductible: false
    } as ExpenseTypeInputDto,

    expected: {
        id: 1,
        name: 'Lainan korko',
        description: 'Pankkilaina lyhennyksen koron osuus',
        isTaxDeductible: true,
    },

    expectedPut: {
        id: 1,
        name: 'Lainan lyhennys',
        description: 'Pankkilaina lyhennyksen lainan lyhennys',
        isTaxDeductible: false
    }
} as TestData