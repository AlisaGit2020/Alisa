// frontend/test/views/UserDetailsView.test.tsx
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import { createMockUser } from '@test-utils/test-data';
import ApiClient from '@alisa-lib/api-client';

// Mock the withTranslation HOC to avoid i18n namespace issues
jest.mock('react-i18next', () => ({
  ...jest.requireActual('react-i18next'),
  withTranslation: () => (Component: React.ComponentType) => {
    const WrappedComponent = (props: object) => {
      // Provide translations for the user namespace
      const translations: Record<string, string> = {
        tier: 'Tier',
        tierPrice: 'Price',
        tierMaxProperties: 'Max Properties',
        tierUnlimited: 'Unlimited',
        tierCurrency: '/mo',
        tierNoTier: 'No tier assigned',
        // Language codes as translation keys
        en: 'English',
        fi: 'Finnish',
        '': '',
      };
      const t = (key: string) => translations[key] ?? key;
      return <Component {...props} t={t} />;
    };
    WrappedComponent.displayName = `withTranslation(${Component.displayName || Component.name})`;
    return WrappedComponent;
  },
}));

// Import after mocking
import UserDetails from '../../src/components/user/UserDetails';

describe('UserDetails Integration', () => {
  const mockUserWithTier = createMockUser({
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    language: 'en',
    photo: 'https://example.com/photo.jpg',
    tier: {
      id: 1,
      name: 'Premium',
      price: 9.99,
      maxProperties: 10,
      sortOrder: 1,
      isDefault: false,
    },
  });

  const mockUserWithoutTier = createMockUser({
    id: 2,
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    language: 'fi',
    photo: '',
    tier: undefined,
  });

  const mockUserWithUnlimitedTier = createMockUser({
    id: 3,
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    language: 'en',
    tier: {
      id: 2,
      name: 'Enterprise',
      price: 49.99,
      maxProperties: 0, // 0 means unlimited
      sortOrder: 2,
      isDefault: false,
    },
  });

  let mockMe: jest.SpyInstance;
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockMe = jest.spyOn(ApiClient, 'me');
    mockOnClose.mockClear();
  });

  afterEach(() => {
    mockMe.mockRestore();
  });

  describe('Happy path', () => {
    it('displays dialog when open is true', async () => {
      mockMe.mockResolvedValue(mockUserWithTier);

      renderWithProviders(<UserDetails open={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('displays user name and avatar', async () => {
      mockMe.mockResolvedValue(mockUserWithTier);

      renderWithProviders(<UserDetails open={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Check avatar alt text and src
      const avatar = screen.getByRole('img', { name: 'John Doe' });
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/photo.jpg');
    });

    it('displays user email with icon', async () => {
      mockMe.mockResolvedValue(mockUserWithTier);

      renderWithProviders(<UserDetails open={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      });

      // Email icon should be present
      const emailIcon = document.querySelector('svg[data-testid="EmailIcon"]');
      expect(emailIcon).toBeInTheDocument();
    });

    it('displays tier information', async () => {
      mockMe.mockResolvedValue(mockUserWithTier);

      renderWithProviders(<UserDetails open={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Premium')).toBeInTheDocument();
      });

      // Tier price should be displayed
      expect(screen.getByText(/9\.99/)).toBeInTheDocument();

      // Max properties should be displayed
      expect(screen.getByText(/10/)).toBeInTheDocument();
    });

    it('displays tier icons when user has tier', async () => {
      mockMe.mockResolvedValue(mockUserWithTier);

      renderWithProviders(<UserDetails open={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Premium')).toBeInTheDocument();
      });

      // Check for tier-related icons
      expect(document.querySelector('svg[data-testid="LayersIcon"]')).toBeInTheDocument();
      expect(document.querySelector('svg[data-testid="PaymentIcon"]')).toBeInTheDocument();
      expect(document.querySelector('svg[data-testid="HomeIcon"]')).toBeInTheDocument();
    });
  });

  describe('User without tier', () => {
    it('displays no tier chip', async () => {
      mockMe.mockResolvedValue(mockUserWithoutTier);

      renderWithProviders(<UserDetails open={true} onClose={mockOnClose} />);

      await waitFor(() => {
        // The component uses t('tierNoTier') when no tier is assigned
        expect(screen.getByText(/tierNoTier|No tier assigned/)).toBeInTheDocument();
      });
    });

    it('does not display tier price details when no tier', async () => {
      mockMe.mockResolvedValue(mockUserWithoutTier);

      renderWithProviders(<UserDetails open={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Payment and Home icons should not be present (tier details)
      expect(document.querySelector('svg[data-testid="PaymentIcon"]')).not.toBeInTheDocument();
      expect(document.querySelector('svg[data-testid="HomeIcon"]')).not.toBeInTheDocument();
    });
  });

  describe('Unlimited tier', () => {
    it('displays unlimited text for maxProperties of 0', async () => {
      mockMe.mockResolvedValue(mockUserWithUnlimitedTier);

      renderWithProviders(<UserDetails open={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Enterprise')).toBeInTheDocument();
      });

      // The component uses t('tierUnlimited') for maxProperties === 0
      // In the rendered output, we see the translation key or value depending on mock setup
      expect(screen.getByText(/tierUnlimited|Unlimited/)).toBeInTheDocument();
    });
  });

  describe('Dialog behavior', () => {
    it('does not show dialog when open is false', () => {
      mockMe.mockResolvedValue(mockUserWithTier);

      renderWithProviders(<UserDetails open={false} onClose={mockOnClose} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('calls onClose when Escape key is pressed', async () => {
      const user = userEvent.setup();
      mockMe.mockResolvedValue(mockUserWithTier);

      renderWithProviders(<UserDetails open={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      mockMe.mockResolvedValue(mockUserWithTier);

      renderWithProviders(<UserDetails open={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const backdrop = document.querySelector('.MuiBackdrop-root');
      if (backdrop) {
        await user.click(backdrop);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });
  });

  describe('API calls', () => {
    it('fetches user data on mount', async () => {
      mockMe.mockResolvedValue(mockUserWithTier);

      renderWithProviders(<UserDetails open={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(mockMe).toHaveBeenCalled();
      });
    });

    it('displays fetched user data', async () => {
      mockMe.mockResolvedValue(mockUserWithTier);

      renderWithProviders(<UserDetails open={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
        expect(screen.getByText('Premium')).toBeInTheDocument();
      });
    });
  });

  describe('Edge cases', () => {
    it('handles user without photo', async () => {
      mockMe.mockResolvedValue(mockUserWithoutTier);

      renderWithProviders(<UserDetails open={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Avatar should still be present
      const avatars = document.querySelectorAll('.MuiAvatar-root');
      expect(avatars.length).toBeGreaterThanOrEqual(1);
    });

    it('formats tier price correctly', async () => {
      mockMe.mockResolvedValue(mockUserWithTier);

      renderWithProviders(<UserDetails open={true} onClose={mockOnClose} />);

      await waitFor(() => {
        // Price formatted with 2 decimal places
        expect(screen.getByText(/9\.99/)).toBeInTheDocument();
      });
    });
  });
});
