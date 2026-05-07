import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import userEvent from '@testing-library/user-event';
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

describe('EditableDetailRow (text edit mode)', () => {
  it('renders a TextField in edit mode prefilled with the value', () => {
    renderWithProviders(
      <EditableDetailRow
        label="Street"
        value="Old street"
        editing
        inputType="text"
        onSave={jest.fn()}
      />
    );
    expect(screen.getByLabelText('Street')).toHaveValue('Old street');
  });

  it('saves on blur with the new value', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn().mockResolvedValue(undefined);

    renderWithProviders(
      <EditableDetailRow
        label="Street"
        value="Old"
        editing
        inputType="text"
        onSave={onSave}
      />
    );

    const input = screen.getByLabelText('Street');
    await user.clear(input);
    await user.type(input, 'New');
    await user.tab();

    expect(onSave).toHaveBeenCalledWith('New');
  });

  it('saves on Enter and does not save again on the resulting blur', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn().mockResolvedValue(undefined);

    renderWithProviders(
      <EditableDetailRow
        label="Street"
        value="Old"
        editing
        inputType="text"
        onSave={onSave}
      />
    );

    const input = screen.getByLabelText('Street');
    await user.clear(input);
    await user.type(input, 'New{Enter}');

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith('New');
  });

  it('reverts on Escape and does not save', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();

    renderWithProviders(
      <EditableDetailRow
        label="Street"
        value="Old"
        editing
        inputType="text"
        onSave={onSave}
      />
    );

    const input = screen.getByLabelText('Street');
    await user.clear(input);
    await user.type(input, 'New{Escape}');

    expect(onSave).not.toHaveBeenCalled();
    expect(input).toHaveValue('Old');
  });

  it('reverts to original value when onSave rejects', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn().mockRejectedValue(new Error('fail'));

    renderWithProviders(
      <EditableDetailRow
        label="Street"
        value="Old"
        editing
        inputType="text"
        onSave={onSave}
      />
    );

    const input = screen.getByLabelText('Street');
    await user.clear(input);
    await user.type(input, 'New');
    await user.tab();

    // After rejected save, input value should restore to "Old"
    expect(input).toHaveValue('Old');
  });
});
