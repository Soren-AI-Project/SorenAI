'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { ApiClient } from './apiClient';

interface MensajesContextType {
  mensajesNoLeidos: number;
  cargarMensajesNoLeidos: (tipo: string, id: string) => Promise<void>;
  userProfile: {tipo: string, id: string} | null;
  setUserProfile: React.Dispatch<React.SetStateAction<{tipo: string, id: string} | null>>;
}

// Valores por defecto para el contexto
const defaultValues: MensajesContextType = {
  mensajesNoLeidos: 0,
  cargarMensajesNoLeidos: async () => {}, // función vacía
  userProfile: null,
  setUserProfile: () => {}, // función vacía
};

const MensajesContext = createContext<MensajesContextType>(defaultValues);

export function MensajesProvider({ children }: { children: ReactNode }) {
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);
  const [userProfile, setUserProfile] = useState<{tipo: string, id: string} | null>(null);
  const lastProfileRef = useRef<{tipo: string, id: string} | null>(null);
  const isLoadingRef = useRef(false);

  // ✅ SEGURO: Función memoizada para cargar mensajes no leídos usando la API
  const cargarMensajesNoLeidos = useCallback(async (tipo: string, id: string) => {
    // Evitar múltiples llamadas simultáneas
    if (isLoadingRef.current) return;
    
    try {
      isLoadingRef.current = true;
      const data = await ApiClient.contarMensajesNoLeidos(tipo, id);
      setMensajesNoLeidos(data.mensajesNoLeidos || 0);
    } catch (error) {
      console.error("Error al cargar mensajes no leídos:", error);
    } finally {
      isLoadingRef.current = false;
    }
  }, []);

  // Este efecto detecta cambios en el perfil del usuario y actualiza los mensajes
  useEffect(() => {
    // Solo cargar si realmente cambió el perfil
    if (userProfile && 
        (!lastProfileRef.current || 
         lastProfileRef.current.tipo !== userProfile.tipo || 
         lastProfileRef.current.id !== userProfile.id)) {
      
      lastProfileRef.current = userProfile;
      cargarMensajesNoLeidos(userProfile.tipo, userProfile.id);
    } else if (!userProfile) {
      lastProfileRef.current = null;
      setMensajesNoLeidos(0);
    }
  }, [userProfile, cargarMensajesNoLeidos]);

  return (
    <MensajesContext.Provider value={{ 
      mensajesNoLeidos, 
      cargarMensajesNoLeidos,
      userProfile,
      setUserProfile
    }}>
      {children}
    </MensajesContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useMensajes() {
  const context = useContext(MensajesContext);
  // Ya no lanzamos error, siempre devolvemos un contexto válido
  return context;
} 