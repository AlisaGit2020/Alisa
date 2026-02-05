import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import AlisaFormHandler from './AlisaFormHandler';
import DataService from '@alisa-lib/data-service';
import AlisaContext from '@alisa-lib/alisa-contexts';
import { TestInputDto } from '../../../../test/mocks/TestInputDto';

// Constants are mocked via jest.config.js moduleNameMapper
jest.mock('@alisa-lib/data-service');

describe('AlisaFormHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form components', async () => {
    const mockRead = jest.fn().mockResolvedValue({ id: 1, name: 'Mocked Data' });
    jest.spyOn(DataService.prototype, 'read').mockImplementation(mockRead);

    const context: AlisaContext = {
      apiPath: 'test/data',
      name: 'Test context',
      routePath: '/test/data'
    };

    renderWithProviders(
      <AlisaFormHandler<TestInputDto>
        formComponents={<div data-testid="formComponents">Form Content</div>}
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
        onCancel={() => {}}
        onSetData={jest.fn()}
        onAfterSubmit={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('formComponents')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    const mockRead = jest.fn().mockResolvedValue({ id: 1, name: 'Mocked Data' });
    jest.spyOn(DataService.prototype, 'read').mockImplementation(mockRead);

    const context: AlisaContext = {
      apiPath: 'test/data',
      name: 'Test context',
      routePath: '/test/data'
    };

    renderWithProviders(
      <AlisaFormHandler<TestInputDto>
        formComponents={<div data-testid="formComponents">Form Content</div>}
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
        onCancel={() => {}}
        onSetData={jest.fn()}
        onAfterSubmit={jest.fn()}
      />
    );

    // Initially, loading should show progress bar
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('calls save when submit button is clicked', async () => {
    const user = userEvent.setup();
    const mockRead = jest.fn().mockResolvedValue({ id: 1, name: 'Mocked Data' });
    const mockSave = jest.fn().mockResolvedValue({ id: 1, name: 'Saved Data' });

    jest.spyOn(DataService.prototype, 'read').mockImplementation(mockRead);
    jest.spyOn(DataService.prototype, 'save').mockImplementation(mockSave);

    const context: AlisaContext = {
      apiPath: 'test/data',
      name: 'Test context',
      routePath: '/test/data'
    };

    renderWithProviders(
      <AlisaFormHandler<TestInputDto>
        formComponents={<div data-testid="formComponents">Form Content</div>}
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
        onCancel={() => {}}
        onSetData={jest.fn()}
        onAfterSubmit={jest.fn()}
      />
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Save')).not.toBeDisabled();
    });

    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    await waitFor(() => {
      expect(DataService.prototype.save).toHaveBeenCalledWith(
        { name: 'Test name' },
        1
      );
    });
  });
});
