
import { TestData } from "../test-data";
import { ExpenseInputDto } from "src/accounting/expense/dtos/expense-input.dto";
import { ExpenseTypeInputDto } from "src/accounting/expense/dtos/expense-type-input.dto";
import { TransactionInputDto } from "src/accounting/transaction/dtos/transaction-input.dto";


export const expenseTestData = {
    name: 'Expense',
    tables: ['expense', 'expense_type', 'transaction'],
    baseUrl: '/accounting/expense',
    baseUrlWithId: '/accounting/expense/1',

    inputPost: {
        expenseType: {
            name: 'Lainan lyhennys',
            description: 'Pankkilainanlyhennyksen lyhennyksen osuus',
            isTaxDeductible: false,
        } as ExpenseTypeInputDto,
        transaction: {
            description: 'Siivousmaksu',
            transactionDate: '2023-01-31',
            accountingDate: '2023-02-28',
            amount: 9.91,
            quantity: 4,
            totalAmount: 39.64
        } as TransactionInputDto
    } as ExpenseInputDto,

    inputPut: {
        expenseType: {
            id: 1,
            name: 'Lainan korko',
            description: 'Pankkilainanlyhennyksen koron osuus',
            isTaxDeductible: true,
        } as ExpenseTypeInputDto,
        transaction: {
            id: 1,
            description: 'Yhtiövastike',
            transactionDate: '2023-02-28',
            accountingDate: '2023-03-31',
            amount: 188,
            quantity: 1,
            totalAmount: 188
        } as TransactionInputDto
    } as ExpenseInputDto,

    expected: {
        expenseType: {
            id: 1,
            name: 'Lainan lyhennys',
            description: 'Pankkilainanlyhennyksen lyhennyksen osuus',
            isTaxDeductible: false,
        },
        transaction: {
            description: 'Siivousmaksu',
            transactionDate: '2023-01-31',
            accountingDate: '2023-02-28',
            amount: 9.91,
            quantity: 4,
            totalAmount: 39.64,
            id: 1,
        },
        id: 1,
    },

    expectedPut: {
        id: 1,
        expenseType: {
            id: 1,
            name: 'Lainan korko',
            description: 'Pankkilainanlyhennyksen koron osuus',
            isTaxDeductible: true,
        },
        transaction: {
            id: 1,
            description: 'Yhtiövastike',
            transactionDate: '2023-02-28',
            accountingDate: '2023-03-31',
            amount: 188.00,
            quantity: 1.00,
            totalAmount: 188.00,
        }
    }
} as TestData