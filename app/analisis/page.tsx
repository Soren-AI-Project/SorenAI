'use client';

import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Link from "next/link";
import { useAuth } from "../../utils/useAuth";
import { ApiClient } from "../../utils/apiClient";
import Layout from "../../components/Layout";
import { supabase } from "../../utils/supabaseClient";

// Deshabilitar el prerenderizado estático para páginas que requieren autenticación
export const dynamic = 'force-dynamic';

interface Agricultor {
  id: string;
  nombre: string;
}

interface Tecnico {
  id: string;
  nombre: string;
}

interface Parcela {
  id: string;
  cultivo: string;
  ha: number;
  agricultor: Agricultor;
}

interface Analisis {
  id: string;
  resultado: string;
  model_response?: string;
  fecha: string;
  path_foto?: string;
  parcela: Parcela;
}

// Componente para mostrar imágenes de análisis
const AnalisisImagenes = ({ carpeta }: { carpeta: string }) => {
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarImagenes = async () => {
      try {
        const { data, error } = await supabase.storage
          .from('imganalisis')
          .list(carpeta);

        if (error) {
          console.error('Error cargando imágenes:', error);
          return;
        }

        if (data) {
          const imageFiles = data
            .filter(file => file.name.startsWith('foto_'))
            .map(file => `${carpeta}/${file.name}`);
          setImagenes(imageFiles);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarImagenes();
  }, [carpeta]);

  if (loading) {
    return (
      <div className="text-center text-gray-400 text-sm">
        Cargando imágenes...
      </div>
    );
  }

  if (imagenes.length === 0) {
    return null;
  }

  return (
    <div className="mt-3">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {imagenes.slice(0, 4).map((path, index) => (
          <img 
            key={index}
            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/imganalisis/${path}`}
            alt={`Análisis ${index + 1}`} 
            className="w-full h-16 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => window.open(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/imganalisis/${path}`, '_blank')}
            onError={(e) => {
              console.error('Error cargando imagen:', path);
              e.currentTarget.style.display = 'none';
            }}
          />
        ))}
        {imagenes.length > 4 && (
          <div className="w-full h-16 bg-gray-700 rounded border flex items-center justify-center text-gray-400 text-sm">
            +{imagenes.length - 4}
          </div>
        )}
      </div>
    </div>
  );
};

export default function AnalisisPage() {
  const [analisis, setAnalisis] = useState<Analisis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedAnalisis, setSelectedAnalisis] = useState<Analisis | null>(null);
  const [showAnalisisModal, setShowAnalisisModal] = useState(false);

  useAuth(setUserProfile);

  // Cargar análisis usando la API
  useEffect(() => {
    const fetchAnalisis = async () => {
      if (!userProfile) return;
      
      setLoading(true);
      setError("");
      
      try {
        const response = await ApiClient.obtenerAnalisis(
          userProfile.tipo, 
          userProfile.id
        );
        
        if (response.success) {
          setAnalisis(response.analisis || []);
        } else {
          setError("Error al cargar los análisis");
        }
      } catch (error) {
        console.error('Error obteniendo análisis:', error);
        setError('Error al cargar los análisis');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalisis();
  }, [userProfile]);

  const handleVerDetalle = (analisisItem: Analisis) => {
    setSelectedAnalisis(analisisItem);
    setShowAnalisisModal(true);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8 text-center text-green-500">Cargando análisis...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <Link 
            href="/dashboard"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors cursor-pointer"
          >
            Volver al Dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-green-400">
              Análisis de Suelo
            </h1>
            <p className="text-gray-400">
              {userProfile?.tipo === 'admin' 
                ? `Análisis de todos tus técnicos (${analisis.length} total)`
                : `Tus análisis realizados (${analisis.length} total)`
              }
            </p>
          </div>
          <Link 
            href="/dashboard"
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors cursor-pointer"
          >
            Volver al Dashboard
          </Link>
        </div>

        {/* Lista de análisis */}
        {analisis.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <div className="text-gray-400 text-lg mb-4">
              📊 No hay análisis disponibles
            </div>
            <p className="text-gray-500">
              {userProfile?.tipo === 'admin' 
                ? 'Tus técnicos aún no han realizado análisis'
                : 'Aún no has realizado análisis de suelo'
              }
            </p>
            <Link 
              href="/parcelas"
              className="inline-block mt-4 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors cursor-pointer"
            >
              Ver Parcelas
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {analisis.map((analisisItem) => (
              <div 
                key={analisisItem.id}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-green-400">
                        Análisis de parcela [{formatearFecha(analisisItem.fecha).split(' ')[0]}]
                      </h3>
                      {analisisItem.model_response && (
                        <span className="px-2 py-1 bg-blue-900/30 text-blue-400 text-xs rounded-full border border-blue-500/30">
                          🤖 IA
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Parcela:</span>
                        <div className="text-white">
                          {analisisItem.parcela.cultivo} • {analisisItem.parcela.ha} ha
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-gray-400">Agricultor:</span>
                        <div className="text-white">
                          {analisisItem.parcela.agricultor.nombre}
                        </div>
                      </div>
                      
                      {userProfile?.tipo === 'admin' && (
                        <div>
                          <span className="text-gray-400">Técnico:</span>
                          <div className="text-white">
                            {(analisisItem.parcela as any).agricultor?.tecnico?.nombre || 'Sin asignar'}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <span className="text-gray-400">Fecha:</span>
                        <div className="text-white">
                          {formatearFecha(analisisItem.fecha)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleVerDetalle(analisisItem)}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors cursor-pointer ml-4"
                  >
                    Ver Detalle
                  </button>
                </div>
                
                {/* Preview del resultado */}
                <div className="bg-gray-700/50 rounded-lg p-4 mb-3">
                  <div className="text-gray-300 text-sm line-clamp-3">
                    {analisisItem.resultado}
                  </div>
                </div>
                
                {/* Imágenes del análisis */}
                {analisisItem.path_foto && (
                  <AnalisisImagenes carpeta={analisisItem.path_foto} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal de detalle del análisis */}
        <Transition appear show={showAnalisisModal} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => setShowAnalisisModal(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-50" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-gray-800 shadow-xl transition-all border border-gray-700">
                    {/* Header del modal */}
                    <div className="border-b border-gray-700 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-green-900/30 flex items-center justify-center mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-400">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
                            </svg>
                          </div>
                          <div>
                            <Dialog.Title as="h3" className="text-xl font-semibold text-green-400">
                              {selectedAnalisis && `Análisis de parcela [${formatearFecha(selectedAnalisis.fecha).split(' ')[0]}]`}
                            </Dialog.Title>
                            <p className="text-sm text-gray-400">
                              {selectedAnalisis && `${selectedAnalisis.parcela.cultivo} • ${selectedAnalisis.parcela.ha} ha • ${formatearFecha(selectedAnalisis.fecha)}`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowAnalisisModal(false)}
                          className="text-gray-400 hover:text-gray-300 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* Contenido del análisis */}
                    <div className="px-6 py-6 max-h-96 overflow-y-auto">
                      {selectedAnalisis && (
                        <div className="space-y-6">
                          {/* Información de la parcela */}
                          <div className="bg-gray-700/30 rounded-lg p-4">
                            <h4 className="text-lg font-medium text-green-400 mb-3">Información de la Parcela</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">Cultivo:</span>
                                <div className="text-white">{selectedAnalisis.parcela.cultivo}</div>
                              </div>
                              <div>
                                <span className="text-gray-400">Superficie:</span>
                                <div className="text-white">{selectedAnalisis.parcela.ha} hectáreas</div>
                              </div>
                              <div>
                                <span className="text-gray-400">Agricultor:</span>
                                <div className="text-white">{selectedAnalisis.parcela.agricultor.nombre}</div>
                              </div>
                              {userProfile?.tipo === 'admin' && (
                                <div>
                                  <span className="text-gray-400">Técnico:</span>
                                  <div className="text-white">
                                    {(selectedAnalisis.parcela as any).agricultor?.tecnico?.nombre || 'Sin asignar'}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Resultado básico */}
                          <div>
                            <h4 className="text-lg font-medium text-green-400 mb-3">Resultado del Análisis</h4>
                            <div className="bg-gray-700/50 rounded-lg p-4">
                              <div className="text-gray-200 whitespace-pre-wrap text-sm">
                                {selectedAnalisis.resultado}
                              </div>
                            </div>
                          </div>

                          {/* Respuesta del modelo IA */}
                          {selectedAnalisis.model_response && (
                            <div>
                              <h4 className="text-lg font-medium text-blue-400 mb-3 flex items-center">
                                🤖 Análisis con Inteligencia Artificial
                              </h4>
                              <div className="bg-blue-900/20 rounded-lg p-4 border-l-4 border-blue-400">
                                <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                                  {selectedAnalisis.model_response}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Imágenes */}
                          {selectedAnalisis.path_foto && (
                            <div>
                              <h4 className="text-lg font-medium text-green-400 mb-3">Imágenes del Análisis</h4>
                              <AnalisisImagenes carpeta={selectedAnalisis.path_foto} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer del modal */}
                    <div className="border-t border-gray-700 px-6 py-4 bg-gray-800/50">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                          onClick={() => setShowAnalisisModal(false)}
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    </Layout>
  );
} 