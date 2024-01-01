
import { TestData } from "../test-data";
import { ExpenseInputDto } from "src/accounting/expense/dtos/expense-input.dto";
import { TransactionInputDto } from "src/accounting/transaction/dtos/transaction-input.dto";


export const expenseTestData = {
    name: 'Expense',
    tables: ['expense', 'transaction'],
    baseUrl: '/accounting/expense',
    baseUrlWithId: '/accounting/expense/1',

    inputPost: {
        transaction: {
            description: 'Siivousmaksu',
            transactionDate: new Date('2023-01-31'),
            accountingDate: new Date('2023-02-31'),
            amount: 9.91,
            quantity: 4,
            totalAmount: 39.64
        } as TransactionInputDto
    } as ExpenseInputDto,

    inputPut: {
        transaction: {
            description: 'Yhtiövastike',
            transactionDate: new Date('2023-02-31'),
            accountingDate: new Date('2023-03-31'),
            amount: 188,
            quantity: 1,
            totalAmount: 188
        } as TransactionInputDto
    } as ExpenseInputDto,

    expected: {
        transaction: {
            description: 'Siivousmaksu',
            transactionDate: '2023-01-31',
            accountingDate: '2023-03-03',
            amount: 9.91,
            quantity: 4,
            totalAmount: 39.64,
            id: 1,
        },
        id: 1,
    },

    expectedPut: {
        id: 1,
        transaction: {
            id: 1,
            description: 'Yhtiövastike',
            transactionDate: '2023-02-31',
            accountingDate: '2023-03-31',
            amount: 188.00,
            quantity: 1.00,
            totalAmount: 188.00,
        }
    }
} as TestData