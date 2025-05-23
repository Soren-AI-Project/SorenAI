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
        
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (!user?.id) {
          setLoading(false);
          return;
        }
        
        // ✅ SEGURO: Usar la API para obtener el perfil de usuario
        const response = await ApiClient.obtenerPerfilUsuario(user.id);
        
        if (response.userProfile) { 
          if (setUserProfileCallback) { 
            setUserProfileCallback(response.userProfile);     
          }       
        } else {      
          console.error('❌ No se encontró perfil de usuario para ID:', user.id); 
          console.error('📋 Necesitas agregar este usuario a la tabla tecnico en Supabase');
          console.error('🔗 Email del usuario:', user.email);       
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