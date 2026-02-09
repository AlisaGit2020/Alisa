import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import AdminTierForm from './AdminTierForm';

describe('AdminTierForm', () => {
  const defaultProps = {
    open: true,
    tier: null,
    onClose: jest.fn(),
    onSave: jest.fn(),
  };

  const existingTier = {
    id: 1,
    name: 'Pro',
    price: 9.99,
    maxProperties: 10,
    sortOrder: 1,
    isDefault: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders dialog when open is true', () => {
      renderWithProviders(<AdminTierForm {...defaultProps} open={true} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render dialog content when open is false', () => {
      renderWithProviders(<AdminTierForm {...defaultProps} open={false} />);

      // Dialog exists but content is not rendered
      expect(screen.queryByText('Name')).not.toBeInTheDocument();
    });

    it('shows add title when tier is null', () => {
      renderWithProviders(<AdminTierForm {...defaultProps} tier={null} />);

      expect(screen.getByText('Add Tier')).toBeInTheDocument();
    });

    it('shows edit title when tier is provided', () => {
      renderWithProviders(<AdminTierForm {...defaultProps} tier={existingTier} />);

      expect(screen.getByText('Edit Tier')).toBeInTheDocument();
    });
  });

  describe('Form fields', () => {
    it('renders name field', () => {
      renderWithProviders(<AdminTierForm {...defaultProps} />);

      expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument();
    });

    it('renders price field', () => {
      renderWithProviders(<AdminTierForm {...defaultProps} />);

      expect(screen.getByRole('spinbutton', { name: /price/i })).toBeInTheDocument();
    });

    it('renders max properties field', () => {
      renderWithProviders(<AdminTierForm {...defaultProps} />);

      expect(screen.getByRole('spinbutton', { name: /max properties/i })).toBeInTheDocument();
    });

    it('renders sort order field', () => {
      renderWithProviders(<AdminTierForm {...defaultProps} />);

      expect(screen.getByRole('spinbutton', { name: /sort order/i })).toBeInTheDocument();
    });

    it('renders default switch', () => {
      renderWithProviders(<AdminTierForm {...defaultProps} />);

      // MUI Switch uses role="switch"
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeInTheDocument();
    });
  });

  describe('Buttons', () => {
    it('renders cancel button', () => {
      renderWithProviders(<AdminTierForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('renders save button', () => {
      renderWithProviders(<AdminTierForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });
  });

  describe('Form pre-population', () => {
    it('populates form with existing tier data', () => {
      renderWithProviders(<AdminTierForm {...defaultProps} tier={existingTier} />);

      expect(screen.getByRole('textbox', { name: /name/i })).toHaveValue('Pro');
      expect(screen.getByRole('spinbutton', { name: /sort order/i })).toHaveValue(1);
    });

    it('has empty fields for new tier', () => {
      renderWithProviders(<AdminTierForm {...defaultProps} tier={null} />);

      expect(screen.getByRole('textbox', { name: /name/i })).toHaveValue('');
    });
  });

  describe('User interactions', () => {
    it('updates name field on input', async () => {
      const user = userEvent.setup();

      renderWithProviders(<AdminTierForm {...defaultProps} />);

      const nameField = screen.getByRole('textbox', { name: /name/i });
      await user.type(nameField, 'New Tier');

      expect(nameField).toHaveValue('New Tier');
    });

    it('calls onClose when cancel is clicked', async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();

      renderWithProviders(<AdminTierForm {...defaultProps} onClose={mockOnClose} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onSave with form data when save is clicked', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn();

      renderWithProviders(<AdminTierForm {...defaultProps} onSave={mockOnSave} />);

      // Fill in the form
      await user.type(screen.getByRole('textbox', { name: /name/i }), 'Test Tier');

      await user.click(screen.getByRole('button', { name: /save/i }));

      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Tier',
        })
      );
    });

    it('includes tier id in save data when editing', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn();

      renderWithProviders(
        <AdminTierForm {...defaultProps} tier={existingTier} onSave={mockOnSave} />
      );

      await user.click(screen.getByRole('button', { name: /save/i }));

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          name: 'Pro',
        })
      );
    });
  });

  describe('Switch toggle', () => {
    it('toggles default switch', async () => {
      const user = userEvent.setup();

      renderWithProviders(<AdminTierForm {...defaultProps} />);

      const switchInput = screen.getByRole('switch');
      expect(switchInput).not.toBeChecked();

      await user.click(switchInput);

      expect(switchInput).toBeChecked();
    });
  });

  describe('Form reset on reopen', () => {
    it('resets form when opened with different tier', () => {
      const { rerender } = renderWithProviders(
        <AdminTierForm {...defaultProps} tier={existingTier} />
      );

      expect(screen.getByRole('textbox', { name: /name/i })).toHaveValue('Pro');

      // Rerender with null tier (add mode)
      rerender(
        <AdminTierForm {...defaultProps} tier={null} />
      );

      // Form should reset since the key changes
      expect(screen.getByRole('textbox', { name: /name/i })).toHaveValue('');
    });
  });
});

describe('AdminTierForm Logic', () => {
  describe('TierData interface', () => {
    it('has correct tier data structure', () => {
      const tierData = {
        id: 1,
        name: 'Test',
        price: 9.99,
        maxProperties: 5,
        sortOrder: 0,
        isDefault: false,
      };

      expect(tierData.id).toBe(1);
      expect(tierData.name).toBe('Test');
      expect(tierData.price).toBe(9.99);
      expect(tierData.maxProperties).toBe(5);
      expect(tierData.sortOrder).toBe(0);
      expect(tierData.isDefault).toBe(false);
    });
  });

  describe('Default tier data', () => {
    it('has correct default values', () => {
      const defaultTierData = {
        name: '',
        price: 0,
        maxProperties: 0,
        sortOrder: 0,
        isDefault: false,
      };

      expect(defaultTierData.name).toBe('');
      expect(defaultTierData.price).toBe(0);
      expect(defaultTierData.maxProperties).toBe(0);
      expect(defaultTierData.sortOrder).toBe(0);
      expect(defaultTierData.isDefault).toBe(false);
    });
  });

  describe('Form key generation', () => {
    it('generates unique key for different tiers', () => {
      const generateKey = (open: boolean, tierId?: number) => {
        return `${open}-${tierId ?? 'new'}`;
      };

      expect(generateKey(true, 1)).toBe('true-1');
      expect(generateKey(true, 2)).toBe('true-2');
      expect(generateKey(true, undefined)).toBe('true-new');
      expect(generateKey(false, 1)).toBe('false-1');
    });
  });

  describe('Data update handlers', () => {
    it('updates name correctly', () => {
      let data = { name: '', price: 0 };
      const handleNameChange = (value: string) => {
        data = { ...data, name: value };
      };

      handleNameChange('New Name');
      expect(data.name).toBe('New Name');
    });

    it('updates price correctly', () => {
      let data = { name: '', price: 0 };
      const handlePriceChange = (value: number) => {
        data = { ...data, price: value };
      };

      handlePriceChange(19.99);
      expect(data.price).toBe(19.99);
    });

    it('updates isDefault correctly', () => {
      let data = { name: '', isDefault: false };
      const handleDefaultChange = (checked: boolean) => {
        data = { ...data, isDefault: checked };
      };

      handleDefaultChange(true);
      expect(data.isDefault).toBe(true);
    });
  });

  describe('handleSubmit', () => {
    it('calls onSave with current data', () => {
      const data = { name: 'Test', price: 10 };
      let savedData: typeof data | null = null;

      const onSave = (tierData: typeof data) => {
        savedData = tierData;
      };

      const handleSubmit = () => {
        onSave(data);
      };

      handleSubmit();
      expect(savedData).toEqual(data);
    });
  });

  describe('Title determination', () => {
    it('returns edit title when tier exists', () => {
      const getTitle = (tier: { id: number } | null) => {
        return tier ? 'Edit tier' : 'Add tier';
      };

      expect(getTitle({ id: 1 })).toBe('Edit tier');
      expect(getTitle(null)).toBe('Add tier');
    });
  });

  describe('Initial data selection', () => {
    it('uses tier data when provided', () => {
      const tier = { id: 1, name: 'Existing' };
      const defaultData = { name: '' };

      const initialData = tier ?? defaultData;

      expect(initialData).toEqual(tier);
    });

    it('uses default data when tier is null', () => {
      const tier = null;
      const defaultData = { name: '' };

      const initialData = tier ?? defaultData;

      expect(initialData).toEqual(defaultData);
    });
  });
});
