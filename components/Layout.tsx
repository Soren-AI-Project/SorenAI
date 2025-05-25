'use client';

import { ReactNode } from 'react';
import { useMensajes } from '../utils/MensajesContext';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../utils/useAuth';

interface LayoutProps {
  children: ReactNode;
}

// Componente principal - sin loading global, cada página maneja el suyo
export default function Layout({ children }: LayoutProps) {
  const { setUserProfile } = useMensajes();
  useAuth(setUserProfile); // Solo ejecuta la autenticación, sin loading

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto py-8 px-6 relative">
          {children}
        </main>
      </div>
    </div>
  );
} 