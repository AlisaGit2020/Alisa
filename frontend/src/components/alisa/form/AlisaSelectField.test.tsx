import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlisaSelectField from './AlisaSelectField';

const mockItems = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' },
];

describe('AlisaSelectField', () => {
    it('renders with provided props', () => {
        const mockOnChange = jest.fn();

        const props = {
            id: 'select-field-id',
            label: 'Test Label',
            value: 1,
            adornment: 'Adornment',
            autoComplete: 'off',
            autoFocus: true,
            disabled: false,
            fullWidth: false,
            items: mockItems,
            onChange: mockOnChange,
        };

        render(<AlisaSelectField {...props} />);

    });

});
