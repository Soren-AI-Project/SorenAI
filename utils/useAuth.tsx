'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabaseClient';
import { ApiClient } from './apiClient';

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
      
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      try {
        // ✅ SEGURO: Usar la API para obtener el perfil de usuario
        const response = await ApiClient.obtenerPerfilUsuario(user.id);
        
        if (response.userProfile) {
          if (setUserProfileCallback) {
            setUserProfileCallback(response.userProfile);
          }
        } else {
          console.error('No se encontró perfil de usuario para:', user.id);
        }
      } catch (error) {
        console.error('Error obteniendo perfil de usuario:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router, setUserProfileCallback]);

  return { user, loading };
} 