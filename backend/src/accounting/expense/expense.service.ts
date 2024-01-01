import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { ExpenseInputDto } from './dtos/expense-input.dto';

@Injectable()
export class ExpenseService {
    constructor(
        @InjectRepository(Expense)
        private expenseRepository: Repository<Expense>,
    ) { }

    async findAll(): Promise<Expense[]> {
        return this.expenseRepository.find();
    }

    async findOne(id: number): Promise<Expense> {
        return this.expenseRepository.findOneBy({ id: id });
    }

    async add(
        input: ExpenseInputDto,
    ): Promise<Expense> {

        const expenseEntity = new Expense();

        this.mapData(expenseEntity, input)

        return await this.expenseRepository.save(expenseEntity);
    }

    async update(
        id: number,
        input: ExpenseInputDto,
    ): Promise<Expense> {

        const expenseEntity = await this.findOne(id);

        this.mapData(expenseEntity, input)

        await this.expenseRepository.save(expenseEntity);
        return expenseEntity;
    }

    async delete(id: number): Promise<void> {
        await this.expenseRepository.delete(id);
    }

    private mapData(expense: Expense, input: ExpenseInputDto) {
        Object.entries(input).forEach(([key, value]) => {
            if (value !== undefined) {
                expense[key] = value;
            }
        });
    }
}
