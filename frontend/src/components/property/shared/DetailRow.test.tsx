import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import HomeIcon from '@mui/icons-material/Home';
import DetailRow from './DetailRow';

describe('DetailRow', () => {
  it('renders icon, label and value', () => {
    renderWithProviders(
      <DetailRow
        icon={<HomeIcon data-testid="icon" />}
        label="Size"
        value="45 m²"
      />
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('Size')).toBeInTheDocument();
    expect(screen.getByText('45 m²')).toBeInTheDocument();
  });

  it('renders without icon when not provided', () => {
    renderWithProviders(
      <DetailRow
        label="Size"
        value="45 m²"
      />
    );

    expect(screen.getByText('Size')).toBeInTheDocument();
    expect(screen.getByText('45 m²')).toBeInTheDocument();
  });

  it('uses compact typography', () => {
    renderWithProviders(
      <DetailRow
        label="Size"
        value="45 m²"
      />
    );

    const label = screen.getByText('Size');

    // Label should be caption size (12px = 0.75rem)
    expect(label).toHaveStyle({ fontSize: '0.75rem' });
  });
});
