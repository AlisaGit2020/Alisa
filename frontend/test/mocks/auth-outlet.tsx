// Mock for @auth-kit/react-router/AuthOutlet
import React from 'react';
import { Outlet } from 'react-router-dom';

interface AuthOutletProps {
  fallbackPath?: string;
}

export default function AuthOutlet({ fallbackPath }: AuthOutletProps) {
  // Always render the outlet (simulate authenticated user)
  return <Outlet />;
}