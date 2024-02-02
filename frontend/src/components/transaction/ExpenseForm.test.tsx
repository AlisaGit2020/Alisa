import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';

import ExpenseForm from './ExpenseForm';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import DataService from '@alisa-lib/data-service';
import { ExpenseInputDto } from '@alisa-backend/accounting/expense/dtos/expense-input.dto';

jest.mock('../../constants', () => ({
  VITE_API_URL: 'http://localhost',
}));
jest.mock('../../lib/data-service');

describe('ExpenseForm Component', () => {
  beforeAll(() => {
    const mockRead = jest.fn().mockResolvedValue(
      {
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
      } as ExpenseInputDto);

    jest.spyOn(DataService.prototype, 'read').mockResolvedValue(mockRead);

    const mockSearch = jest.fn().mockResolvedValue(
      [
        {
          id: 1,
          name: 'Item 1'
        },
        {
          id: 5,
          name: 'Item 5'
        }
      ]
    );

    // Mock the DataService constructor
    jest.spyOn(DataService.prototype, 'search').mockResolvedValue(mockSearch);

  })
  it('renders ExpenseForm correctly', async () => {
    const { container } = render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MemoryRouter>
          <ExpenseForm />
        </MemoryRouter>
      </LocalizationProvider>
    );

    // Assert that the component renders without crashing
    expect(container).toBeInTheDocument();

    // Add more assertions based on your component's behavior
    // For example, you can check if specific elements or labels are present on the form.
  });

  it('handles form submission correctly', async () => {


    // Render the component with mocked dependencies
    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MemoryRouter>
          <ExpenseForm id={5} />
        </MemoryRouter>
      </LocalizationProvider>
    );

  });

  // Add more test cases based on your component's functionality
  // For example, test the handleChange function, fetch data, etc.
});
