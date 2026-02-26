import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import PropertyInfoCard from './PropertyInfoCard';

describe('PropertyInfoCard', () => {
  it('renders title and children', () => {
    renderWithProviders(
      <PropertyInfoCard title="Property Info">
        <div>Child content</div>
      </PropertyInfoCard>
    );

    expect(screen.getByText('Property Info')).toBeInTheDocument();
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('renders title in uppercase', () => {
    renderWithProviders(
      <PropertyInfoCard title="Location">
        <span>Address here</span>
      </PropertyInfoCard>
    );

    const title = screen.getByText('Location');
    expect(title).toHaveStyle({ textTransform: 'uppercase' });
  });

  it('renders multiple children', () => {
    renderWithProviders(
      <PropertyInfoCard title="Details">
        <div>Row 1</div>
        <div>Row 2</div>
        <div>Row 3</div>
      </PropertyInfoCard>
    );

    expect(screen.getByText('Row 1')).toBeInTheDocument();
    expect(screen.getByText('Row 2')).toBeInTheDocument();
    expect(screen.getByText('Row 3')).toBeInTheDocument();
  });
});
