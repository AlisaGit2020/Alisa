// Mock for react-helmet-async
import React from 'react';

export const Helmet: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const HelmetProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export default { Helmet, HelmetProvider };