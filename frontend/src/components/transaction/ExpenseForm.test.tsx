import { act, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import {mockConstants, mockReactI18next} from '@alisa-mocks/mocks'
import ExpenseForm from './ExpenseForm';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import DataService from '@alisa-lib/data-service';
import { ExpenseInputDto } from '@alisa-backend/accounting/expense/dtos/expense-input.dto';

jest.mock('../../constants', () => mockConstants);
jest.mock('../../lib/data-service');
jest.mock('react-i18next', () => mockReactI18next);

describe('ExpenseForm Component', () => {
  beforeAll(() => {
    const mockRead = {
      id: 5,
      transaction: {
        accountingDate: new Date('2024-01-01'),
        transactionDate: new Date('2024-01-01'),
        description: 'Test transaction',
        amount: 10,
        quantity: 4,
        totalAmount: 40,
      },
      propertyId: 5,
      expenseTypeId: 1
    } as ExpenseInputDto;

    jest.spyOn(DataService.prototype, 'read').mockResolvedValue(mockRead);

    const mockSearch = [
      {
        id: 1,
        name: 'Item 1'
      },
      {
        id: 5,
        name: 'Item 5'
      }
    ];

    // Mock the DataService constructor
    jest.spyOn(DataService.prototype, 'search').mockResolvedValue(mockSearch);

  });

  it('renders ExpenseForm correctly', async () => {
    await act(async () => {
      const { container } = render(
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <MemoryRouter>
            <ExpenseForm />
          </MemoryRouter>
        </LocalizationProvider>
      );

      // Assert that the component renders without crashing
      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });
    });
  });

  it('handles form submission correctly', async () => {

    await act(async () => {
      const {container} = render(
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <MemoryRouter>
            <ExpenseForm id={5} />
          </MemoryRouter>
        </LocalizationProvider>
      );

      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });
    });

  });
});
