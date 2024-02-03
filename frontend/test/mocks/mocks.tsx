// mocks.ts
import React from 'react';
import '@testing-library/jest-dom';

type MockedComponentType = React.ComponentType<{ t: () => string }> & {
  displayName?: string;
};

export const mockReactI18next = {
  withTranslation: () => (Component: MockedComponentType) => {
    const WithTranslation: React.FC = (props) => (
      <Component t={() => ''} {...props} />
    );
    WithTranslation.displayName = `WithTranslation(${Component.displayName || Component.name || 'Component'})`;
    return WithTranslation;
  },
  useTranslation: () => ({ t: (key: string) => key }),
};

export const mockConstants = {
  VITE_API_URL: 'http://localhost',
}
