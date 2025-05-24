'use client';

import { ReactNode } from 'react';
import { useMensajes } from '../utils/MensajesContext';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../utils/useAuth';

interface LayoutProps {
  children: ReactNode;
}

// Componente interno que usa tanto el contexto como el hook de auth
function LayoutContent({ children }: LayoutProps) {
  const { setUserProfile } = useMensajes();
  const { loading } = useAuth(setUserProfile);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-20 h-20 mb-4 flex items-center justify-center relative mx-auto">
            <div className="absolute inset-0 flex items-center justify-center animate-spin">
              <svg className="w-16 h-16 text-green-400 opacity-60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" strokeDasharray="62.8 62.8" />
              </svg>
            </div>
            
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-12 h-12">
              <path d="M30 60 L30 80 L70 80 L70 60 Z" fill="#1e3a3a" />
              <rect x="28" y="80" width="44" height="5" rx="2" fill="#1a2e2e" />
              <ellipse cx="50" cy="85" rx="22" ry="3" fill="rgba(0,0,0,0.1)" />
              <path d="M50 60 L50 45" stroke="#2e9e6b" strokeWidth="2" fill="none" />
              <path d="M50 45 Q60 40 65 30 Q50 32 50 45" fill="#26ae7b" />
              <path d="M50 45 Q40 35 30 33 Q45 45 50 45" fill="#26ae7b" />
              <path d="M50 45 Q40 40 35 30 Q50 32 50 45" fill="#26ae7b" />
              <path d="M50 50 Q60 48 70 55 Q55 45 50 50" fill="#26ae7b" />
              <path d="M58 36 Q55 38 55 35" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />
              <path d="M42 38 Q45 40 45 37" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />
            </svg>
          </div>
          <div className="text-lg font-medium text-green-400 mb-2">SorenAI</div>
          <p className="text-gray-300">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto py-8 px-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// Componente principal que proporciona el contexto
export default function Layout({ children }: LayoutProps) {
  return (
    <LayoutContent>
      {children}
    </LayoutContent>
  );
} 