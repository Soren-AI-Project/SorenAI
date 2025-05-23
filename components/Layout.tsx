'use client';

import { ReactNode, useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useRouter } from 'next/navigation';
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
        <div className="text-white text-2xl">Cargando...</div>
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
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Solo ejecutar en el cliente, no durante el prerenderizado
    if (typeof window === 'undefined') {
      return;
    }

    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (!data.session) {
          router.push('/login');
          return;
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error verificando sesión:', error);
        router.push('/login');
      }
    };

    checkUser();
  }, [router]);

  // Durante el prerenderizado o carga inicial
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-2xl">Cargando...</div>
      </div>
    );
  }

  return (
    <LayoutContent>
      {children}
    </LayoutContent>
  );
} 