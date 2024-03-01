import { Transaction } from "@alisa-backend/accounting/transaction/entities/transaction.entity";
import { User } from "@alisa-backend/people/user/entities/user.entity";

export const emptyUser: User = {
    firstName: '',
    lastName: '',
    email: '',
    language: '',
    photo: '',
    ownerships: []
}

export const emptyTransaction: Transaction = {
    id: 0,
    sender: '',
    receiver: '',
    description: '',
    transactionDate: new Date('2000-01-01'),
    accountingDate: new Date('2000-01-01'),
    amount: 0,
    quantity: 0,
    totalAmount: 0,
    expense: undefined,
    income: undefined
}