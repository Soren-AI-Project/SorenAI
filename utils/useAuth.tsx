'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabaseClient';
import { ApiClient } from './apiClient';

interface UserProfile {
  id: string;
  tipo: string;
  nombre?: string;
}

export function useAuth(setUserProfileCallback?: (profile: UserProfile | null) => void) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const hasInitialized = useRef(false);
  const currentUserProfile = useRef<UserProfile | null>(null);

  // Función memoizada para obtener el perfil
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const response = await ApiClient.obtenerPerfilUsuario(userId);
      if (response.userProfile) {
        currentUserProfile.current = response.userProfile;
        if (setUserProfileCallback) {
          setUserProfileCallback(response.userProfile);
        }
      }
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
    }
  }, [setUserProfileCallback]);

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      // Evitar múltiples inicializaciones
      if (hasInitialized.current) return;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          
          // Solo obtener perfil si no lo tenemos o si cambió el usuario
          if (setUserProfileCallback && (!currentUserProfile.current || currentUserProfile.current.id !== session.user.id)) {
            await fetchUserProfile(session.user.id);
          }
        } else {
          // No hay sesión, redirigir solo si estamos en ruta protegida
          const path = window.location.pathname;
          const isProtectedRoute = ['/dashboard', '/parcelas', '/mensajes', '/tecnicos', '/analisis'].some(route => 
            path.startsWith(route)
          );
          
          if (isProtectedRoute) {
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('Error verificando sesión:', error);
      } finally {
        if (mounted) {
          setLoading(false);
          hasInitialized.current = true;
        }
      }
    };

    getSession();

    // Listener para detectar cuando la página se vuelve visible
    const handleVisibilityChange = () => {
      // No hacer nada especial cuando la página se vuelve visible
      // Esto evita recargas innecesarias
      if (document.visibilityState === 'visible') {
        // Página visible - manteniendo estado actual
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          currentUserProfile.current = null;
          if (setUserProfileCallback) {
            setUserProfileCallback(null);
          }
          
          const path = window.location.pathname;
          if (path !== '/login' && path !== '/') {
            router.push('/login');
          }
        } else if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          
          // Solo obtener perfil si cambió el usuario
          if (setUserProfileCallback && (!currentUserProfile.current || currentUserProfile.current.id !== session.user.id)) {
            await fetchUserProfile(session.user.id);
          }
        }
        
        if (mounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      subscription.unsubscribe();
    };
  }, [router, fetchUserProfile]);

  return { user, loading };
} 