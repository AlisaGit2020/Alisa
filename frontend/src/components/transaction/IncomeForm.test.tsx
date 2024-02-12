import { act, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import {mockConstants, mockReactI18next} from '@alisa-mocks/mocks'
import IncomeForm from './IncomeForm';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import DataService from '@alisa-lib/data-service';
import { IncomeInputDto } from '@alisa-backend/accounting/income/dtos/income-input.dto';

jest.mock('../../constants', () => mockConstants);
jest.mock('../../lib/data-service');
jest.mock('react-i18next', () => mockReactI18next);

describe('IncomeForm Component', () => {

  let getDefaultsMock: jest.SpyInstance<Promise<IncomeInputDto>>;
  let readMock: jest.SpyInstance<Promise<IncomeInputDto>>;  

  beforeAll(() => {
    const mockRead = {
      id: 5,
      transaction: {
        sender: 'Yrjöntie',
        receiver: 'Espoon kaupunki',
        accountingDate: new Date('2024-01-01'),
        transactionDate: new Date('2024-01-01'),
        description: 'Test transaction',
        amount: 10,
        quantity: 4,
        totalAmount: 40,
      },
      propertyId: 5,
      incomeTypeId: 1
    } as IncomeInputDto;

    readMock = jest.spyOn(DataService.prototype, 'read').mockResolvedValue(mockRead);

    const mockDefaults = {
      id: 5,
      transaction: {
        sender: 'Yrjöntie',
        receiver: 'Espoon kaupunki',
        accountingDate: new Date('2024-01-01'),
        transactionDate: new Date('2024-01-01'),
        description: 'Test transaction',
        amount: 10,
        quantity: 4,
        totalAmount: 40,
      },
      propertyId: 5,
      incomeTypeId: 1
    } as IncomeInputDto;

    getDefaultsMock = jest.spyOn(DataService.prototype, 'getDefaults').mockResolvedValue(mockDefaults);
    
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
    
    jest.spyOn(DataService.prototype, 'search').mockResolvedValue(mockSearch);

  });

  beforeEach(() => {
    getDefaultsMock.mockClear();
    readMock.mockClear();
  })

  it('renders IncomeForm add', async () => {

    await act(async () => {
      const { container } = render(
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <MemoryRouter>
            <IncomeForm />
          </MemoryRouter>
        </LocalizationProvider>
      );

      // Assert that the component renders without crashing
      await waitFor(() => {
        expect(container).toBeInTheDocument();
        
      });
    });

    expect(getDefaultsMock).toHaveBeenCalledTimes(1);
    expect(readMock).toHaveBeenCalledTimes(0);
  });

  it('renders IncomeForm edit', async () => {    

    await act(async () => {
      const {container} = render(
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <MemoryRouter>
            <IncomeForm id={5} />
          </MemoryRouter>
        </LocalizationProvider>
      );

      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });
    });

    expect(getDefaultsMock).toHaveBeenCalledTimes(0);
    expect(readMock).toHaveBeenCalledWith(5);
    expect(readMock).toHaveBeenCalledTimes(1);

  });
});
