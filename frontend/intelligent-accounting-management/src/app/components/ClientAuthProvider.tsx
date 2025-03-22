'use client';

import { useEffect, useState, ReactNode } from 'react';
import { AuthProvider } from '../context/AuthContext';

export default function ClientAuthProvider({ children }: { children: ReactNode }) {
  // Track if we're on the client
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Always render the AuthProvider, but pass isSSR flag
  return (
    <AuthProvider isSSR={!isClient}>
      {children}
    </AuthProvider>
  );
} 