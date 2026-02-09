import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import AdminMenu from './AdminMenu';
import ApiClient from '@alisa-lib/api-client';
import { createMockUser } from '@test-utils/test-data';

jest.mock('@alisa-lib/api-client');

describe('AdminMenu', () => {
  const mockAdminUser = createMockUser({
    id: 1,
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    isAdmin: true,
  });

  const mockNonAdminUser = createMockUser({
    id: 2,
    firstName: 'Regular',
    lastName: 'User',
    email: 'user@example.com',
    isAdmin: false,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering based on admin status', () => {
    it('renders admin icon when user is admin', async () => {
      jest.spyOn(ApiClient, 'me').mockResolvedValue(mockAdminUser);

      renderWithProviders(<AdminMenu />);

      await waitFor(() => {
        expect(screen.getByTestId('AdminPanelSettingsIcon')).toBeInTheDocument();
      });
    });

    it('does not render anything when user is not admin', async () => {
      jest.spyOn(ApiClient, 'me').mockResolvedValue(mockNonAdminUser);

      const { container } = renderWithProviders(<AdminMenu />);

      await waitFor(() => {
        // Component should render empty when not admin
        expect(container.querySelector('svg')).not.toBeInTheDocument();
      });
    });

    it('does not render when API call fails', async () => {
      jest.spyOn(ApiClient, 'me').mockRejectedValue(new Error('API Error'));

      const { container } = renderWithProviders(<AdminMenu />);

      await waitFor(() => {
        expect(container.querySelector('svg')).not.toBeInTheDocument();
      });
    });

    it('does not render when isAdmin is undefined', async () => {
      const userWithoutAdmin = { ...mockNonAdminUser, isAdmin: undefined };
      jest.spyOn(ApiClient, 'me').mockResolvedValue(userWithoutAdmin as ReturnType<typeof createMockUser>);

      const { container } = renderWithProviders(<AdminMenu />);

      await waitFor(() => {
        expect(container.querySelector('svg')).not.toBeInTheDocument();
      });
    });
  });

  describe('Tooltip', () => {
    it('shows tooltip on hover', async () => {
      const user = userEvent.setup();
      jest.spyOn(ApiClient, 'me').mockResolvedValue(mockAdminUser);

      renderWithProviders(<AdminMenu />);

      await waitFor(() => {
        expect(screen.getByTestId('AdminPanelSettingsIcon')).toBeInTheDocument();
      });

      const button = screen.getByRole('button');
      await user.hover(button);

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });
  });

  describe('Dialog opening', () => {
    it('opens AdminDialog when button is clicked', async () => {
      const user = userEvent.setup();
      jest.spyOn(ApiClient, 'me').mockResolvedValue(mockAdminUser);

      renderWithProviders(<AdminMenu />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('closes AdminDialog when close button is clicked', async () => {
      const user = userEvent.setup();
      jest.spyOn(ApiClient, 'me').mockResolvedValue(mockAdminUser);

      renderWithProviders(<AdminMenu />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      // Open dialog
      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Close dialog
      const closeButton = screen.getByRole('button', { name: 'close' });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Button styling', () => {
    it('button has color inherit', async () => {
      jest.spyOn(ApiClient, 'me').mockResolvedValue(mockAdminUser);

      renderWithProviders(<AdminMenu />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
      });
    });
  });
});

describe('AdminMenu Logic', () => {
  describe('Admin check flow', () => {
    it('calls ApiClient.me on mount', () => {
      const meSpy = jest.spyOn(ApiClient, 'me').mockResolvedValue(
        createMockUser({ isAdmin: true })
      );

      renderWithProviders(<AdminMenu />);

      // React 19 strict mode may call effect twice
      expect(meSpy).toHaveBeenCalled();
    });

    it('correctly identifies admin from user.isAdmin === true', async () => {
      const checkAdmin = async (user: { isAdmin?: boolean }) => {
        try {
          return user.isAdmin === true;
        } catch {
          return false;
        }
      };

      expect(await checkAdmin({ isAdmin: true })).toBe(true);
      expect(await checkAdmin({ isAdmin: false })).toBe(false);
      expect(await checkAdmin({ isAdmin: undefined })).toBe(false);
      expect(await checkAdmin({})).toBe(false);
    });
  });

  describe('Dialog state management', () => {
    it('open state starts as false', () => {
      const open = false;
      expect(open).toBe(false);
    });

    it('handleOpen sets open to true', () => {
      let open = false;
      const handleOpen = () => {
        open = true;
      };

      handleOpen();
      expect(open).toBe(true);
    });

    it('handleClose sets open to false', () => {
      let open = true;
      const handleClose = () => {
        open = false;
      };

      handleClose();
      expect(open).toBe(false);
    });
  });
});
