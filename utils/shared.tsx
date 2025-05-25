'use client';

import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// Función compartida para formatear fechas
export const formatearFecha = (fecha: string) => {
  const date = new Date(fecha);
  const fechaStr = date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const horaStr = date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });
  return `${fechaStr} ${horaStr}`;
};

// Función compartida para formatear fechas en mensajes
export const formatearFechaMensaje = (fechaStr: string) => {
  const fecha = new Date(fechaStr);
  return fecha.toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Sistema de notificaciones mejorado
export interface NotificationState {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  show: boolean;
}

export const useNotification = () => {
  const [notification, setNotification] = useState<NotificationState>({
    message: '',
    type: 'info',
    show: false
  });

  const showNotification = (message: string, type: NotificationState['type'] = 'info') => {
    setNotification({ message, type, show: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  return { notification, showNotification, hideNotification };
};

// Componente de notificación
export const NotificationComponent = ({ 
  notification, 
  onClose 
}: { 
  notification: NotificationState; 
  onClose: () => void;
}) => {
  if (!notification.show) return null;

  const getNotificationStyles = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-900/50 border-green-500 text-green-300';
      case 'error':
        return 'bg-red-900/50 border-red-500 text-red-300';
      case 'warning':
        return 'bg-yellow-900/50 border-yellow-500 text-yellow-300';
      default:
        return 'bg-blue-900/50 border-blue-500 text-blue-300';
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border ${getNotificationStyles()} shadow-lg max-w-md`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="mr-3">
            {getIcon()}
          </div>
          <p className="text-sm font-medium">{notification.message}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-current hover:opacity-70 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Componente compartido para mostrar imágenes de análisis
export const AnalisisImagenes = ({ carpeta }: { carpeta: string }) => {
  const [imagenes, setImagenes] = useState<{path: string, signedUrl: string, publicUrl: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarImagenes = async () => {
      try {
        // Primero obtener la lista de archivos
        const { data, error } = await supabase.storage
          .from('imganalisis')
          .list(carpeta);

        if (error) {
          setError(`Error al acceder a la carpeta: ${error.message}`);
          setImagenes([]);
          setLoading(false);
          return;
        }

        if (data && data.length > 0) {
          // Filtrar solo las imágenes
          const imageFiles = data.filter(file => file.name.startsWith('foto_'));
          
          if (imageFiles.length === 0) {
            setImagenes([]);
            setError(null);
            setLoading(false);
            return;
          }

          // Crear URLs tanto firmadas como públicas para cada imagen
          const imagenesConUrls = await Promise.all(
            imageFiles.map(async (file) => {
              const filePath = `${carpeta}/${file.name}`;
              
              // URL pública
              const { data: publicData } = supabase.storage
                .from('imganalisis')
                .getPublicUrl(filePath);
              
              const publicUrl = publicData.publicUrl;
              
              // URL firmada como fallback
              let signedUrl = '';
              try {
                const { data: signedData, error: signedError } = await supabase.storage
                  .from('imganalisis')
                  .createSignedUrl(filePath, 3600);

                if (!signedError && signedData) {
                  signedUrl = signedData.signedUrl;
                }
              } catch (error) {
                // Error silencioso para URL firmada
              }

              return {
                path: filePath,
                signedUrl,
                publicUrl
              };
            })
          );

          setImagenes(imagenesConUrls);
          setError(null);
        } else {
          setImagenes([]);
          setError(null);
        }
      } catch (error) {
        setError(`Error general: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      } finally {
        setLoading(false);
      }
    };

    if (carpeta) {
      cargarImagenes();
    }
  }, [carpeta]);

  if (loading) {
    return (
      <div className="text-center text-gray-400 text-sm">
        Cargando imágenes...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-400 text-sm">
        {error}
      </div>
    );
  }

  if (imagenes.length === 0) {
    return (
      <div className="text-center text-gray-400 text-sm">
        No se encontraron imágenes para este análisis
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {imagenes.map((imagen, index) => {
          // Usar URL firmada si está disponible, sino URL pública
          const imageUrl = imagen.signedUrl || imagen.publicUrl;
          
          return (
            <div key={index} className="relative group">
              <img 
                src={imageUrl}
                alt={`Análisis ${index + 1}`} 
                className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => window.open(imageUrl, '_blank')}
                onError={(e) => {
                  // Intentar con la otra URL como fallback
                  const fallbackUrl = imagen.signedUrl ? imagen.publicUrl : imagen.signedUrl;
                  if (fallbackUrl && e.currentTarget.src !== fallbackUrl) {
                    e.currentTarget.src = fallbackUrl;
                  } else {
                    e.currentTarget.style.display = 'none';
                  }
                }}
              />
              <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded">
                {index + 1}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Hook para confirmaciones elegantes
export const useConfirmation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  }>({
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showConfirmation = (newConfig: typeof config) => {
    setConfig(newConfig);
    setIsOpen(true);
  };

  const handleConfirm = () => {
    config.onConfirm();
    setIsOpen(false);
  };

  const handleCancel = () => {
    config.onCancel?.();
    setIsOpen(false);
  };

  return {
    isOpen,
    config,
    showConfirmation,
    handleConfirm,
    handleCancel,
    setIsOpen
  };
};

// Componente de confirmación elegante
export const ConfirmationModal = ({
  isOpen,
  config,
  onConfirm,
  onCancel
}: {
  isOpen: boolean;
  config: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  };
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  if (!isOpen) return null;

  const getButtonStyles = () => {
    switch (config.type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
      default:
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onCancel} />
        <div className="relative bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {config.title}
          </h3>
          <p className="text-gray-300 mb-6">
            {config.message}
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              {config.cancelText || 'Cancelar'}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${getButtonStyles()}`}
            >
              {config.confirmText || 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 