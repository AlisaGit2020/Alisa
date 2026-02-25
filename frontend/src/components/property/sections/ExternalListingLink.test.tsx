import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import ExternalListingLink from './ExternalListingLink';
import { PropertyExternalSource } from '@asset-types';

describe('ExternalListingLink', () => {
  it('renders Etuovi link with correct URL', () => {
    renderWithProviders(
      <ExternalListingLink
        externalSource={PropertyExternalSource.ETUOVI}
        externalSourceId="12345"
      />
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://www.etuovi.com/kohde/12345');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders Oikotie link with correct URL', () => {
    renderWithProviders(
      <ExternalListingLink
        externalSource={PropertyExternalSource.OIKOTIE}
        externalSourceId="67890"
      />
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://asunnot.oikotie.fi/myytavat-asunnot/67890');
  });

  it('renders external link icon', () => {
    renderWithProviders(
      <ExternalListingLink
        externalSource={PropertyExternalSource.ETUOVI}
        externalSourceId="12345"
      />
    );

    // MUI icons render as SVG elements with data-testid
    const link = screen.getByRole('link');
    const svg = link.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders section header', () => {
    renderWithProviders(
      <ExternalListingLink
        externalSource={PropertyExternalSource.ETUOVI}
        externalSourceId="12345"
      />
    );

    // Should render the viewListing translation key
    expect(screen.getByText(/listing/i)).toBeInTheDocument();
  });
});
