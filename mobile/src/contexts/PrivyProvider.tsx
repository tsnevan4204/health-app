import React from 'react';
import { PrivyProvider } from '@privy-io/expo';
import { ENV } from '../config/env';

interface PrivyProviderWrapperProps {
  children: React.ReactNode;
}

export default function PrivyProviderWrapper({ children }: PrivyProviderWrapperProps) {
  return (
    <PrivyProvider appId={ENV.PRIVY_APP_ID}>
      {children}
    </PrivyProvider>
  );
}