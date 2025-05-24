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

export function useAuth(setUserProfileCallback?: (profile: UserProfile) => void) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          
          // Obtener perfil del usuario si se proporciona callback
          if (setUserProfileCallback) {
            try {
              const response = await ApiClient.obtenerPerfilUsuario(session.user.id);
              if (mounted && response.userProfile) {
                setUserProfileCallback(response.userProfile);
              }
            } catch (error) {
              console.error('Error obteniendo perfil:', error);
            }
          }
        } else {
          // No hay sesión, redirigir solo si estamos en ruta protegida
          const path = window.location.pathname;
          const isProtectedRoute = ['/dashboard', '/parcelas', '/mensajes', '/tecnicos'].some(route => 
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
        }
      }
    };

    getSession();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          if (setUserProfileCallback) {
            setUserProfileCallback(null);
          }
          
          const path = window.location.pathname;
          if (path !== '/login' && path !== '/') {
            router.push('/login');
          }
        } else if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          
          // Obtener perfil si se necesita
          if (setUserProfileCallback) {
            try {
              const response = await ApiClient.obtenerPerfilUsuario(session.user.id);
              if (mounted && response.userProfile) {
                setUserProfileCallback(response.userProfile);
              }
            } catch (error) {
              console.error('Error obteniendo perfil:', error);
            }
          }
        }
        
        if (mounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, setUserProfileCallback]);

  return { user, loading };
} 