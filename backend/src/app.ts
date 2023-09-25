import express from 'express';
import { Request, Response } from 'express';
import { Expense } from './entities/Expense';
import dataSource from "./database";
import "reflect-metadata";

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

app.get('/expenses', async (req: Request, res: Response) => {
    try {
        const expenseRepository = dataSource.getRepository(Expense);
        const expenses = await expenseRepository.find();
        return res.json(expenses);
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

export default app;