import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import EditableDetailRow from './EditableDetailRow';

describe('EditableDetailRow (read mode)', () => {
  it('renders label and value as a DetailRow when not editing', () => {
    renderWithProviders(
      <EditableDetailRow
        label="Size"
        value={45}
        editing={false}
        inputType="number"
        onSave={jest.fn()}
        format={(v) => `${v} m²`}
      />
    );

    expect(screen.getByText('Size')).toBeInTheDocument();
    expect(screen.getByText('45 m²')).toBeInTheDocument();
  });

  it('falls back to notSetLabel when value is empty', () => {
    renderWithProviders(
      <EditableDetailRow
        label="District"
        value={null}
        editing={false}
        inputType="text"
        onSave={jest.fn()}
        notSetLabel="—"
      />
    );

    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
