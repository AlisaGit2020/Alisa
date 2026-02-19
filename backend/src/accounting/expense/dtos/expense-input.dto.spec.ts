import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { ExpenseInputDto } from './expense-input.dto';

describe('ExpenseInputDto', () => {
  describe('numeric field transformations', () => {
    it('transforms empty string amount to 0', () => {
      const plain = {
        description: 'Test',
        amount: '',
        quantity: 1,
        totalAmount: 100,
      };

      const dto = plainToInstance(ExpenseInputDto, plain);

      expect(dto.amount).toBe(0);
      expect(typeof dto.amount).toBe('number');
    });

    it('transforms empty string quantity to 1', () => {
      const plain = {
        description: 'Test',
        amount: 100,
        quantity: '',
        totalAmount: 100,
      };

      const dto = plainToInstance(ExpenseInputDto, plain);

      expect(dto.quantity).toBe(1);
      expect(typeof dto.quantity).toBe('number');
    });

    it('transforms empty string totalAmount to 0', () => {
      const plain = {
        description: 'Test',
        amount: 100,
        quantity: 1,
        totalAmount: '',
      };

      const dto = plainToInstance(ExpenseInputDto, plain);

      expect(dto.totalAmount).toBe(0);
      expect(typeof dto.totalAmount).toBe('number');
    });

    it('preserves valid numeric values', () => {
      const plain = {
        description: 'Test',
        amount: 50.5,
        quantity: 2,
        totalAmount: 101,
      };

      const dto = plainToInstance(ExpenseInputDto, plain);

      expect(dto.amount).toBe(50.5);
      expect(dto.quantity).toBe(2);
      expect(dto.totalAmount).toBe(101);
    });

    it('transforms string numbers to numbers', () => {
      const plain = {
        description: 'Test',
        amount: '50.5',
        quantity: '2',
        totalAmount: '101',
      };

      const dto = plainToInstance(ExpenseInputDto, plain);

      expect(dto.amount).toBe(50.5);
      expect(dto.quantity).toBe(2);
      expect(dto.totalAmount).toBe(101);
    });
  });
});
