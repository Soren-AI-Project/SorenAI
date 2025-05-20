'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabaseClient';

// Tipo para el perfil de usuario
type UserProfile = {
  tipo: string;
  id: string;
} | null;

// Función que no usa el contexto de mensajes
export function useAuth(setUserProfileCallback?: (profile: UserProfile) => void) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      
      if (!data.session) {
        router.push('/login');
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // Determinar el tipo de perfil del usuario
      const { data: adminData } = await supabase
        .from('admin')
        .select('id')
        .eq('user_id', user?.id)
        .single();
      
      if (adminData) {
        if (setUserProfileCallback) {
          setUserProfileCallback({ tipo: 'admin', id: adminData.id });
        }
        setLoading(false);
        return;
      }
      
      const { data: tecnicoData } = await supabase
        .from('tecnico')
        .select('id')
        .eq('user_id', user?.id)
        .single();
      
      if (tecnicoData) {
        if (setUserProfileCallback) {
          setUserProfileCallback({ tipo: 'tecnico', id: tecnicoData.id });
        }
        setLoading(false);
        return;
      }
      
      const { data: agricultorData } = await supabase
        .from('agricultor')
        .select('id')
        .eq('user_id', user?.id)
        .single();
      
      if (agricultorData) {
        if (setUserProfileCallback) {
          setUserProfileCallback({ tipo: 'agricultor', id: agricultorData.id });
        }
        setLoading(false);
        return;
      }
      
      setLoading(false);
    };

    checkUser();
  }, [router, setUserProfileCallback]);

  return { user, loading };
} 