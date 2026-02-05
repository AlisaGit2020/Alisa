import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import AlisaAlert from './AlisaAlert';

describe('AlisaAlert', () => {
  it('renders message', () => {
    renderWithProviders(
      <AlisaAlert severity="success" content="Test Message" />
    );

    expect(screen.getByText('Test Message')).toBeInTheDocument();
  });

  it('renders with success severity', () => {
    const { container } = renderWithProviders(
      <AlisaAlert severity="success" content="Success Message" />
    );

    const alert = container.querySelector('.MuiAlert-standardSuccess');
    expect(alert).toBeInTheDocument();
  });

  it('renders with error severity', () => {
    const { container } = renderWithProviders(
      <AlisaAlert severity="error" content="Error Message" />
    );

    const alert = container.querySelector('.MuiAlert-standardError');
    expect(alert).toBeInTheDocument();
  });

  it('renders with warning severity', () => {
    const { container } = renderWithProviders(
      <AlisaAlert severity="warning" content="Warning Message" />
    );

    const alert = container.querySelector('.MuiAlert-standardWarning');
    expect(alert).toBeInTheDocument();
  });

  it('renders with info severity', () => {
    const { container } = renderWithProviders(
      <AlisaAlert severity="info" content="Info Message" />
    );

    const alert = container.querySelector('.MuiAlert-standardInfo');
    expect(alert).toBeInTheDocument();
  });

  it('does not render when content is empty', () => {
    const { container } = renderWithProviders(
      <AlisaAlert severity="success" content="" />
    );

    const alert = container.querySelector('.MuiAlert-root');
    expect(alert).not.toBeInTheDocument();
  });

  it('renders array of messages', () => {
    renderWithProviders(
      <AlisaAlert severity="error" content={['Error 1', 'Error 2', 'Error 3']} />
    );

    expect(screen.getByText('Error 1')).toBeInTheDocument();
    expect(screen.getByText('Error 2')).toBeInTheDocument();
    expect(screen.getByText('Error 3')).toBeInTheDocument();
  });
});
