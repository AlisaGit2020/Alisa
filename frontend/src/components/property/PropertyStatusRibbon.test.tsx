import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import PropertyStatusRibbon from './PropertyStatusRibbon';
import { PropertyStatus } from '@asset-types';

describe('PropertyStatusRibbon', () => {
  it('renders OWN status with ownership percentage', () => {
    renderWithProviders(
      <PropertyStatusRibbon status={PropertyStatus.OWN} ownershipShare={75} />
    );

    expect(screen.getByText(/75/)).toBeInTheDocument();
  });

  it('renders OWN status with 100% ownership by default', () => {
    renderWithProviders(
      <PropertyStatusRibbon status={PropertyStatus.OWN} />
    );

    expect(screen.getByText(/100/)).toBeInTheDocument();
  });

  it('renders PROSPECT status text', () => {
    renderWithProviders(
      <PropertyStatusRibbon status={PropertyStatus.PROSPECT} />
    );

    // Using the translation key which returns 'prospectStatusRibbon' in test i18n
    expect(screen.getByText(/prospect/i)).toBeInTheDocument();
  });

  it('renders SOLD status text', () => {
    renderWithProviders(
      <PropertyStatusRibbon status={PropertyStatus.SOLD} />
    );

    expect(screen.getByText(/sold/i)).toBeInTheDocument();
  });

  it('applies correct styling for ribbon container', () => {
    const { container } = renderWithProviders(
      <PropertyStatusRibbon status={PropertyStatus.OWN} ownershipShare={50} />
    );

    // Check that the ribbon container has proper positioning
    const outerBox = container.firstChild as HTMLElement;
    expect(outerBox).toHaveStyle({ position: 'absolute' });
  });
});
