'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabaseClient';
import { ApiClient } from './apiClient';
import { SessionManager } from './sessionManager';

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
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') {
      return;
    }

    let mounted = true;

    const checkUser = async () => {
      console.log('🔍 useAuth: Verificando usuario...');
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        console.log('🔐 Sesión de Supabase en useAuth:', !!session);

        if (!session?.user) {
          // No hay sesión de Supabase, verificar si hay sesión local válida
          const savedSession = SessionManager.getSavedSessionInfo();
          const isExpired = SessionManager.isSessionExpired();
          
          console.log('💾 Sesión local:', savedSession);
          console.log('⏰ Sesión expirada:', isExpired);
          
          if (!savedSession || isExpired) {
            console.log('❌ No hay sesión válida, redirigiendo al login...');
            // Limpiar cualquier sesión local inválida
            SessionManager.clearSession();
            // Dar tiempo para que Supabase intente recuperar la sesión
            setTimeout(() => {
              if (mounted) {
                router.push('/login');
              }
            }, 1000);
            return;
          } else {
            console.log('✅ Sesión local válida, continuando...');
            // Hay una sesión local válida, no redirigir todavía
          }
        } else {
          console.log('✅ Sesión de Supabase válida');
          setUser(session.user);
          
          // Actualizar información de sesión local
          SessionManager.saveSessionInfo(session.user.id, session.user.email || '');
        }

        // Obtener perfil del usuario si tenemos ID
        const userId = session?.user?.id || SessionManager.getSavedSessionInfo()?.userId;
        
        if (userId && setUserProfileCallback) {
          try {
            console.log('👤 Obteniendo perfil para usuario:', userId);
            const response = await ApiClient.obtenerPerfilUsuario(userId);
            
            if (mounted && response.userProfile) {
              setUserProfileCallback(response.userProfile);
            }
          } catch (error) {
            console.error('❌ Error obteniendo perfil:', error);
          }
        }
        
      } catch (error) {
        console.error('❌ Error en verificación de sesión:', error);
        if (mounted) {
          router.push('/login');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Verificación inicial
    checkUser();

    // Configurar listener para cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('🔄 Auth state changed:', event, !!session);

        if (event === 'SIGNED_OUT' || !session) {
          console.log('🚪 Usuario cerró sesión');
          SessionManager.clearSession();
          setUser(null);
          if (setUserProfileCallback) {
            setUserProfileCallback(null);
          }
          router.push('/login');
        } else if (event === 'SIGNED_IN' && session?.user) {
          console.log('🔑 Usuario inició sesión');
          setUser(session.user);
          setLoading(false);
          
          // Actualizar información de sesión
          SessionManager.saveSessionInfo(session.user.id, session.user.email || '');
          
          // Obtener perfil solo si es necesario
          if (setUserProfileCallback) {
            try {
              const response = await ApiClient.obtenerPerfilUsuario(session.user.id);
              if (mounted && response.userProfile) {
                setUserProfileCallback(response.userProfile);
              }
            } catch (error) {
              console.error('❌ Error obteniendo perfil en login:', error);
            }
          }
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