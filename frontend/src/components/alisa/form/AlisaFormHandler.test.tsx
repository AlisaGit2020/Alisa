import { mockConstants } from '@alisa-mocks/mocks';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils'; // Import act to handle async code
import AlisaFormHandler from './AlisaFormHandler';
import DataService from '../../../lib/data-service';
import AlisaContext from '@alisa-lib/alisa-contexts';
import { TestInputDto } from '../../../../test/mocks/TestInputDto';

jest.mock('../../../constants', () => mockConstants);
jest.mock('../../../lib/data-service');

describe('AlisaFormHandler', () => {
  beforeEach(() => {
    // Clear all mocks and reset their instances before each test
    jest.clearAllMocks();
  });

  test('renders AlisaFormHandler', async () => {
    // Mock DataService's read method to return exampleData
    const mockRead = jest.fn().mockResolvedValueOnce({ id: 1, name: 'Mocked Data' });
    const mockSave = jest.fn().mockResolvedValueOnce({ id: 1, name: 'Saved Data' });

    // Mock the DataService constructor
    jest.spyOn(DataService.prototype, 'read').mockImplementationOnce(mockRead);
    jest.spyOn(DataService.prototype, 'save').mockImplementationOnce(mockSave);

    // Define a mock function for onSetData
    const mockSetData = jest.fn();
    const mockAfterSubmit = jest.fn();

    const context: AlisaContext = {
      apiPath: 'test/data',
      name: 'Test context',
      routePath: '/test/data'
    }

    // Render AlisaFormHandler with necessary props
    const { getByText } = render(
      <AlisaFormHandler<TestInputDto>
        formComponents={<div data-test-id="formComponents" />}
        id={1}
        dataService={new DataService<TestInputDto>({
          context: context,
          dataValidateInstance: new TestInputDto()
        })}
        translation={{
          submitButton: 'Save',
          cancelButton: 'Cancel'
        }}
        data={{ name: 'Test name' }}
        onCancel={() => { }}
        onSetData={mockSetData}
        onAfterSubmit={mockAfterSubmit}
      />
    );

    // Wait for the useEffect to fetch data
    await waitFor(() => {
      expect(DataService.prototype.read).toHaveBeenCalledWith(1);
    });

    // Wait for the formComponents element to be rendered
    await waitFor(() => {
      
    });

    // Trigger save button click after the formComponents element is rendered
    await act(async () => {
      fireEvent.click(getByText('Save'));
    });

    // Wait for save operation to complete
    await waitFor(() => {
      expect(DataService.prototype.save).toHaveBeenCalledWith(
        { name: "Test name" }, 1
      );
      // You may add more assertions based on the actual behavior of your code
    });
  });
});
