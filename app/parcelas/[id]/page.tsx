'use client';

import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../utils/useAuth";
import { ApiClient } from "../../../utils/apiClient";
import Layout from "../../../components/Layout";
import SimpleLoading from "../../../components/SimpleLoading";
import { 
  formatearFecha, 
  AnalisisImagenes, 
  useNotification, 
  NotificationComponent,
  useConfirmation,
  ConfirmationModal
} from "../../../utils/shared";

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

interface Analitica {
  id: string;
  id_parcela: string;
  path_foto?: string;
  resultado?: string;
  model_response?: string;
  fecha: string;
}

interface Parcela {
  id: string;
  cultivo: string;
  ha: number;
  agricultor: Agricultor | null;
  tecnico?: Tecnico;
  fechaPlantacion?: string;
  estado?: boolean;
  ultimoAnalisis?: string;
  analiticas?: Analitica[];
}

// Componente AnalisisImagenes ahora se importa desde utils/shared

export default function DetalleParcelaPage() {
  const [parcela, setParcela] = useState<Parcela | null>(null);
  const [analiticas, setAnaliticas] = useState<Analitica[]>([]);
  const [loading, setLoading] = useState(true); // Inicia en true
  const [error, setError] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [editData, setEditData] = useState({
    cultivo: "",
    ha: 0,
    estado: true,
  });
  const [tecnicosDisponibles, setTecnicosDisponibles] = useState<Tecnico[]>([]);
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState("");
  const [analysisData, setAnalysisData] = useState({
    ph: "",
    conductividad: "",
    fotos: [] as File[]
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzingIA, setIsAnalyzingIA] = useState(false);
  const [analisisIA, setAnalisisIA] = useState<string | null>(null);
  const [showAnalisisModal, setShowAnalisisModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isSavingAndAnalyzing, setIsSavingAndAnalyzing] = useState(false);
  const [selectedAnalisisDetalle, setSelectedAnalisisDetalle] = useState<Analitica | null>(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [eliminandoAnalisis, setEliminandoAnalisis] = useState(false);
  const router = useRouter();
  const params = useParams();
  const parcelaId = params.id as string;

  // Hooks para notificaciones y confirmaciones
  const { notification, showNotification, hideNotification } = useNotification();
  const { isOpen: confirmOpen, config: confirmConfig, showConfirmation, handleConfirm, handleCancel } = useConfirmation();

  useAuth(setUserProfile);

  // Cargar detalles de la parcela usando la API segura
  useEffect(() => {
    const fetchParcelaDetail = async () => {
      if (!parcelaId || !userProfile) return;
      
      try {
        const response = await ApiClient.obtenerDetalleParcela(
          userProfile.tipo, 
          userProfile.id, 
          parcelaId
        );
        
        if (response.parcela) {
          setParcela(response.parcela);
          setAnaliticas(response.parcela.analiticas || []);
          setEditData({
            cultivo: response.parcela.cultivo,
            ha: response.parcela.ha,
            estado: response.parcela.estado === true,
          });
          setTecnicoSeleccionado(response.parcela.tecnico?.id || "");
          setError("");
        } else {
          setError("No se encontró la parcela o no tienes acceso a ella");
        }
      } catch (error) {
        console.error('Error obteniendo detalle de parcela:', error);
        setError('Error al cargar los datos de la parcela');
      } finally {
        setLoading(false);
      }
    };

    fetchParcelaDetail();
  }, [parcelaId, userProfile]);

  const fetchTecnicos = async () => {
    if (userProfile?.tipo === 'admin') {
      try {
        const response = await ApiClient.obtenerTecnicos();
        if (response.success) {
          setTecnicosDisponibles(response.tecnicos || []);
        }
      } catch (error) {
        console.error('Error obteniendo técnicos:', error);
      }
    }
  };

  const handleDelete = async () => {
    // Funcionalidad de eliminación (por implementar en API si se necesita)
    setIsModalOpen(false);
  };

  const handleEdit = async () => {
    // Funcionalidad de edición (por implementar en API si se necesita)
    setIsEditModalOpen(false);
  };

  const handleAnalysis = async () => {
    if (!userProfile || !analysisData.ph || !analysisData.conductividad) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      const response = await ApiClient.crearAnalisis(
        parcelaId,
        analysisData.ph,
        analysisData.conductividad,
        analysisData.fotos,
        userProfile.tipo,
        userProfile.id
      );
      
      if (response.success) {
        // Resetear formulario
        setAnalysisData({
          ph: "",
          conductividad: "",
          fotos: []
        });
        
        setIsAnalysisModalOpen(false);
        
        // Recargar datos de la parcela
        const parcelaResponse = await ApiClient.obtenerDetalleParcela(
          userProfile.tipo, 
          userProfile.id, 
          parcelaId
        );
        
        if (parcelaResponse.parcela) {
          setAnaliticas(parcelaResponse.parcela.analiticas || []);
        }
        
        setSuccessMessage('Análisis creado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error(response.error || 'Error desconocido');
      }
      
    } catch (error) {
      console.error('Error al crear análisis:', error);
      setError(error instanceof Error ? error.message : 'Error al crear el análisis');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnalysisAndAI = async () => {
    if (!userProfile || !analysisData.ph || !analysisData.conductividad) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    setIsSavingAndAnalyzing(true);
    setError('');
    try {
      // Primero crear el análisis
      const response = await ApiClient.crearAnalisis(
        parcelaId,
        analysisData.ph,
        analysisData.conductividad,
        analysisData.fotos,
        userProfile.tipo,
        userProfile.id
      );
      
      if (response.success) {
        // Luego ejecutar análisis con IA
        const iaResponse = await ApiClient.analizarConIA(
          parcelaId,
          userProfile.tipo,
          userProfile.id
        );
        
        if (iaResponse.success) {
          setAnalisisIA(iaResponse.analisis);
          setShowAnalisisModal(true);
        }
        
        // Resetear formulario
        setAnalysisData({
          ph: "",
          conductividad: "",
          fotos: []
        });
        
        setIsAnalysisModalOpen(false);
        
        // Recargar datos de la parcela
        const parcelaResponse = await ApiClient.obtenerDetalleParcela(
          userProfile.tipo, 
          userProfile.id, 
          parcelaId
        );
        
        if (parcelaResponse.parcela) {
          setAnaliticas(parcelaResponse.parcela.analiticas || []);
        }
        
        setSuccessMessage('Análisis creado y analizado con IA exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error(response.error || 'Error desconocido');
      }
      
    } catch (error) {
      console.error('Error al crear y analizar:', error);
      setError(error instanceof Error ? error.message : 'Error al crear y analizar');
    } finally {
      setIsSavingAndAnalyzing(false);
    }
  };

  const handleAnalisisIA = async () => {
    if (!userProfile || !parcela) return;
    
    setIsAnalyzingIA(true);
    try {
      const response = await ApiClient.analizarConIA(
        parcelaId,
        userProfile.tipo,
        userProfile.id
      );
      
      if (response.success) {
        setAnalisisIA(response.analisis);
        setShowAnalisisModal(true);
        
        // Recargar las analíticas para mostrar la nueva
        const parcelaResponse = await ApiClient.obtenerDetalleParcela(
          userProfile.tipo, 
          userProfile.id, 
          parcelaId
        );
        
        if (parcelaResponse.parcela) {
          setAnaliticas(parcelaResponse.parcela.analiticas || []);
        }
      } else {
        throw new Error(response.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error en análisis IA:', error);
      setError(error instanceof Error ? error.message : 'Error al realizar el análisis con IA');
    } finally {
      setIsAnalyzingIA(false);
    }
  };

  const handleAnalisisIndividual = async (analisisId: string) => {
    if (!userProfile || !parcela) return;
    
    setIsAnalyzingIA(true);
    try {
      const response = await ApiClient.analizarConIA(
        parcelaId,
        userProfile.tipo,
        userProfile.id
      );
      
      if (response.success) {
        setAnalisisIA(response.analisis);
        setShowAnalisisModal(true);
        
        // Recargar las analíticas para mostrar la actualización
        const parcelaResponse = await ApiClient.obtenerDetalleParcela(
          userProfile.tipo, 
          userProfile.id, 
          parcelaId
        );
        
        if (parcelaResponse.parcela) {
          setAnaliticas(parcelaResponse.parcela.analiticas || []);
        }
      } else {
        throw new Error(response.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error en análisis IA:', error);
      setError(error instanceof Error ? error.message : 'Error al realizar el análisis con IA');
    } finally {
      setIsAnalyzingIA(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const totalFiles = analysisData.fotos.length + newFiles.length;
      
      if (totalFiles > 8) {
        setError('Máximo 8 fotos permitidas');
        // Resetear el input file
        event.target.value = '';
        return;
      }
      
      setAnalysisData(prev => ({
        ...prev,
        fotos: [...prev.fotos, ...newFiles]
      }));
    }
    
    // Resetear el input file para permitir volver a seleccionar la misma imagen
    event.target.value = '';
  };

  const removePhoto = (index: number) => {
    setAnalysisData(prev => ({
      ...prev,
      fotos: prev.fotos.filter((_, i) => i !== index)
    }));
  };

  const handleVerDetalle = (analitica: Analitica) => {
    setSelectedAnalisisDetalle(analitica);
    setShowDetalleModal(true);
  };

  const handleEliminarAnalisis = async (analisisId: string) => {
    if (!userProfile) return;
    
    showConfirmation({
      title: 'Eliminar Análisis',
      message: '¿Estás seguro de que quieres eliminar este análisis? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      onConfirm: async () => {
        setEliminandoAnalisis(true);
        
        try {
          await ApiClient.eliminarAnalisis(analisisId, userProfile.tipo, userProfile.id);
          
          // Actualizar la lista de análisis
          setAnaliticas(prev => prev.filter(a => a.id !== analisisId));
          setShowDetalleModal(false);
          setSelectedAnalisisDetalle(null);
          
          // Mostrar mensaje de éxito
          showNotification('Análisis eliminado exitosamente', 'success');
        } catch (error) {
          showNotification('Error al eliminar el análisis: ' + (error instanceof Error ? error.message : 'Error desconocido'), 'error');
        } finally {
          setEliminandoAnalisis(false);
        }
      }
    });
  };

  // formatearFecha ahora se importa desde utils/shared

  // Funciones de debugging eliminadas para optimización

  const renderAnaliticas = () => {
    if (analiticas.length === 0) {
      return (
        <div className="text-center py-8 text-gray-400">
          No hay análisis registrados para esta parcela
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        {analiticas.map((analitica) => (
          <div 
            key={analitica.id} 
            className="bg-gray-700 rounded-lg p-4 border border-gray-600"
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-lg font-semibold text-green-400">
                Análisis de parcela {new Date(analitica.fecha).toLocaleDateString('es-ES')}
              </h4>
              <div className="flex items-center gap-2">
                {/* Botón de análisis IA - solo aparece si no tiene model_response */}
                {!analitica.model_response && (userProfile?.tipo === 'tecnico' && parcela?.tecnico?.id === userProfile.id || userProfile?.tipo === 'admin') && (
                  <button
                    className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 flex items-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleAnalisisIndividual(analitica.id)}
                    disabled={isAnalyzingIA}
                  >
                    {isAnalyzingIA ? (
                      <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423L16.5 15.75l.394 1.183a2.25 2.25 0 001.423 1.423L19.5 18.75l-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                      </svg>
                    )}
                    {isAnalyzingIA ? 'Analizando...' : 'Análisis IA'}
                  </button>
                )}
                <button
                  onClick={() => handleVerDetalle(analitica)}
                  className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors cursor-pointer"
                >
                  Ver Detalle
                </button>
                <span className="text-sm text-gray-400">
                  {new Date(analitica.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            
            {analitica.resultado && (
              <div className="mb-3">
                <p className="text-gray-300">{analitica.resultado}</p>
              </div>
            )}
            
            {analitica.model_response && (
              <div className="mb-3">
                <h5 className="text-lg font-medium text-blue-400 mb-2">
                  📊 Análisis del Assistant IA
                </h5>
                <div className="bg-gray-600/50 rounded-lg p-4 border-l-4 border-blue-400">
                  <div className="prose prose-invert max-w-none text-sm">
                    <div className="text-gray-200 whitespace-pre-wrap">
                      {analitica.model_response}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {analitica.path_foto && (
              <div className="mb-3 text-sm text-gray-400">
                📷 Imágenes disponibles - Ver en detalle
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };



  if (error) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <Link 
            href="/parcelas"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors cursor-pointer"
          >
            Volver a Parcelas
          </Link>
        </div>
      </Layout>
    );
  }

  if (!parcela) {
    return (
      <Layout>
        <div className="p-8 text-center text-gray-400">
          No se encontró la parcela
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Componentes de notificación y confirmación */}
      <NotificationComponent notification={notification} onClose={hideNotification} />
      <ConfirmationModal 
        isOpen={confirmOpen}
        config={confirmConfig}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      
      <div className="max-w-6xl mx-auto">
        {/* Mensajes de notificación */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-300">
            {error}
            <button 
              onClick={() => setError('')}
              className="float-right text-red-400 hover:text-red-300"
            >
              ×
            </button>
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 p-4 bg-green-900/50 border border-green-500 rounded-lg text-green-300">
            {successMessage}
          </div>
        )}
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-green-400">
              Parcela de {parcela.agricultor?.nombre || 'Agricultor desconocido'}
            </h1>
            <p className="text-gray-400">
              Cultivo: {parcela.cultivo} • {parcela.ha} hectáreas
            </p>
          </div>
          <div className="flex gap-2">
            <Link 
              href="/parcelas"
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors cursor-pointer"
            >
              Volver
            </Link>

            {userProfile?.tipo === 'tecnico' && parcela.tecnico?.id === userProfile.id && (
              <>
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors cursor-pointer"
                >
                  Editar
                </button>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors cursor-pointer"
                >
                  Eliminar
                </button>
              </>
            )}
            {/* Admins solo pueden reasignar técnicos */}
            {userProfile?.tipo === 'admin' && (
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Reasignar Técnico
              </button>
            )}
          </div>
        </div>

        {/* Información de la parcela */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-green-400 mb-4">Información General</h2>
            <div className="space-y-3">
              <div>
                <span className="text-gray-400">Cultivo:</span>
                <span className="ml-2 text-white">{parcela.cultivo}</span>
              </div>
              <div>
                <span className="text-gray-400">Hectáreas:</span>
                <span className="ml-2 text-white">{parcela.ha}</span>
              </div>
              <div>
                <span className="text-gray-400">Estado:</span>
                <span className={`ml-2 ${parcela.estado === true ? 'text-green-400' : 'text-red-400'}`}>
                  {parcela.estado === true ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Último Análisis:</span>
                <span className="ml-2 text-white">{parcela.ultimoAnalisis || 'Sin análisis'}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-green-400 mb-4">Responsables</h2>
            <div className="space-y-3">
              {parcela.agricultor && (
                <div>
                  <span className="text-gray-400">Agricultor:</span>
                  <span className="ml-2 text-white">{parcela.agricultor.nombre}</span>
                </div>
              )}
              {/* Mostrar técnico solo a admins */}
              {userProfile?.tipo === 'admin' && parcela.tecnico && (
                <div>
                  <span className="text-gray-400">Técnico Asignado:</span>
                  <span className="ml-2 text-white">{parcela.tecnico.nombre}</span>
                </div>
              )}
              {/* Mostrar si no hay técnico asignado (solo para admins) */}
              {userProfile?.tipo === 'admin' && !parcela.tecnico && (
                <div>
                  <span className="text-gray-400">Técnico Asignado:</span>
                  <span className="ml-2 text-yellow-400">Sin asignar</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Análisis */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-green-400">
              Historial de Análisis ({analiticas.length})
            </h2>
            <div className="flex gap-2">

              {/* Solo técnicos pueden realizar análisis manuales */}
              {userProfile?.tipo === 'tecnico' && parcela.tecnico?.id === userProfile.id && (
                <button
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 flex items-center cursor-pointer"
                  onClick={() => {
                    setIsAnalysisModalOpen(true);
                    setError('');
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
                  </svg>
                  Realizar análisis
                </button>
              )}
              
              {/* Botones de debugging eliminados para optimización */}
            </div>
          </div>
          {renderAnaliticas()}
        </div>

        {/* Modal de confirmación para eliminar */}
        <Transition appear show={isModalOpen} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => setIsModalOpen(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
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
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-red-400"
                    >
                      Confirmar eliminación
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-300">
                        ¿Estás seguro de que quieres eliminar esta parcela? Esta acción no se puede deshacer.
                      </p>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors cursor-pointer"
                        onClick={handleDelete}
                      >
                        Eliminar
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors cursor-pointer"
                        onClick={() => setIsModalOpen(false)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Modal de edición */}
        <Transition appear show={isEditModalOpen} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => setIsEditModalOpen(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
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
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-green-400 mb-4"
                    >
                      {userProfile?.tipo === 'admin' ? 'Reasignar Técnico' : 'Editar Parcela'}
                    </Dialog.Title>
                    
                    <div className="space-y-4">
                      {userProfile?.tipo === 'tecnico' ? (
                        // Formulario para técnicos - pueden editar datos de la parcela
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Cultivo
                            </label>
                            <input
                              type="text"
                              value={editData.cultivo}
                              onChange={(e) => setEditData({ ...editData, cultivo: e.target.value })}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Hectáreas
                            </label>
                            <input
                              type="number"
                              value={editData.ha}
                              onChange={(e) => setEditData({ ...editData, ha: parseFloat(e.target.value) || 0 })}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          
                          <div>
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editData.estado}
                                onChange={(e) => setEditData({ ...editData, estado: e.target.checked })}
                                className="mr-2"
                              />
                              <span className="text-gray-300">Activo</span>
                            </label>
                          </div>
                        </>
                      ) : (
                        // Formulario para admins - solo pueden reasignar técnico
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Técnico Asignado
                          </label>
                          <select
                            value={tecnicoSeleccionado}
                            onChange={(e) => setTecnicoSeleccionado(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                            onFocus={() => fetchTecnicos()}
                          >
                            <option value="">Sin asignar</option>
                            {tecnicosDisponibles.map((tecnico) => (
                              <option key={tecnico.id} value={tecnico.id}>
                                {tecnico.nombre}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            Selecciona un técnico para asignar a esta parcela
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex gap-2">
                      <button
                        type="button"
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer"
                        onClick={handleEdit}
                        disabled={isSaving}
                      >
                        {isSaving ? 'Guardando...' : (userProfile?.tipo === 'admin' ? 'Reasignar' : 'Guardar')}
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors cursor-pointer"
                        onClick={() => setIsEditModalOpen(false)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Modal de realizar análisis */}
        <Transition appear show={isAnalysisModalOpen} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => setIsAnalysisModalOpen(false)}>
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
                  <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-gray-800 shadow-xl transition-all border border-gray-700">
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
                              Análisis de Suelo
                            </Dialog.Title>
                            <p className="text-sm text-gray-400">
                              Cultivo: {parcela.cultivo} • {parcela.ha} ha
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setIsAnalysisModalOpen(false);
                            setAnalysisData({ ph: "", conductividad: "", fotos: [] });
                            setError('');
                          }}
                          className="text-gray-400 hover:text-gray-300 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* Contenido del modal */}
                    <div className="px-6 py-6">
                      <div className="space-y-6">
                        {/* Campos de datos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">
                              pH del suelo
                              <span className="text-green-400 ml-1">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="14"
                                value={analysisData.ph}
                                onChange={(e) => setAnalysisData({ ...analysisData, ph: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="6.5"
                              />
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <span className="text-gray-400 text-sm">pH</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500">Rango normal: 6.0 - 7.5</p>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">
                              Conductividad eléctrica
                              <span className="text-green-400 ml-1">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={analysisData.conductividad}
                                onChange={(e) => setAnalysisData({ ...analysisData, conductividad: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="1200"
                              />
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <span className="text-gray-400 text-sm">µS/cm</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500">Conductividad del suelo</p>
                          </div>
                        </div>

                        {/* Sección de fotos */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-gray-300">
                              Fotos del análisis
                            </label>
                            <span className="text-xs text-gray-400">
                              {analysisData.fotos.length}/8 fotos
                            </span>
                          </div>
                          
                          {/* Botón de subida */}
                          <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors">
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleFileUpload}
                              className="hidden"
                              id="photo-upload"
                              disabled={analysisData.fotos.length >= 8}
                            />
                            <label
                              htmlFor="photo-upload"
                              className={`cursor-pointer ${analysisData.fotos.length >= 8 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <div className="space-y-2">
                                <div className="mx-auto w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-300 font-medium">
                                    {analysisData.fotos.length >= 8 ? 'Máximo de fotos alcanzado' : 'Agregar fotos'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {analysisData.fotos.length < 8 ? 'PNG, JPG hasta 10MB cada una' : ''}
                                  </p>
                                </div>
                              </div>
                            </label>
                          </div>

                          {/* Grid de fotos */}
                          {analysisData.fotos.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {analysisData.fotos.map((foto, index) => (
                                <div key={index} className="relative group">
                                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-700 border border-gray-600">
                                    <img
                                      src={URL.createObjectURL(foto)}
                                      alt={`Foto ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  {/* Botón de eliminar */}
                                  <button
                                    onClick={() => removePhoto(index)}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors opacity-0 group-hover:opacity-100 shadow-lg"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                  {/* Número de foto */}
                                  <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded">
                                    {index + 1}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer del modal */}
                    <div className="border-t border-gray-700 px-6 py-4 bg-gray-800/50">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          <span className="text-green-400">*</span> Campos requeridos
                        </div>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                            onClick={() => {
                              setIsAnalysisModalOpen(false);
                              setAnalysisData({ ph: "", conductividad: "", fotos: [] });
                              setError('');
                            }}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                            onClick={handleAnalysis}
                            disabled={isSaving || isSavingAndAnalyzing || !analysisData.ph || !analysisData.conductividad}
                          >
                            {isSaving ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Guardando...
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                Guardar Análisis
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                            onClick={handleAnalysisAndAI}
                            disabled={isSaving || isSavingAndAnalyzing || !analysisData.ph || !analysisData.conductividad}
                          >
                            {isSavingAndAnalyzing ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Guardando y analizando...
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423L16.5 15.75l.394 1.183a2.25 2.25 0 001.423 1.423L19.5 18.75l-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                                </svg>
                                Guardar y Analizar
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Modal de detalle del análisis */}
        <Transition appear show={showDetalleModal} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => setShowDetalleModal(false)}>
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
                              {selectedAnalisisDetalle && `Análisis de parcela ${new Date(selectedAnalisisDetalle.fecha).toLocaleDateString('es-ES')}`}
                            </Dialog.Title>
                            <p className="text-sm text-gray-400">
                              {selectedAnalisisDetalle && `${parcela?.cultivo} • ${parcela?.ha} ha • ${formatearFecha(selectedAnalisisDetalle.fecha)}`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowDetalleModal(false)}
                          className="text-gray-400 hover:text-gray-300 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* Contenido del análisis */}
                    <div className="px-6 py-6 max-h-[600px] overflow-y-auto">
                      {selectedAnalisisDetalle && (
                        <div className="space-y-6"
                             style={{ overflow: 'visible' }}>
                          {/* Información de la parcela */}
                          <div className="bg-gray-700/30 rounded-lg p-4">
                            <h4 className="text-lg font-medium text-green-400 mb-3">Información de la Parcela</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">Cultivo:</span>
                                <div className="text-white">{parcela?.cultivo}</div>
                              </div>
                              <div>
                                <span className="text-gray-400">Superficie:</span>
                                <div className="text-white">{parcela?.ha} hectáreas</div>
                              </div>
                              <div>
                                <span className="text-gray-400">Agricultor:</span>
                                <div className="text-white">{parcela?.agricultor?.nombre}</div>
                              </div>
                              {userProfile?.tipo === 'admin' && (
                                <div>
                                  <span className="text-gray-400">Técnico:</span>
                                  <div className="text-white">
                                    {parcela?.tecnico?.nombre || 'Sin asignar'}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Resultado básico */}
                          {selectedAnalisisDetalle.resultado && (
                            <div>
                              <h4 className="text-lg font-medium text-green-400 mb-3">Resultado del Análisis</h4>
                              <div className="bg-gray-700/50 rounded-lg p-4">
                                <div className="text-gray-200 whitespace-pre-wrap text-sm">
                                  {selectedAnalisisDetalle.resultado}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Respuesta del modelo IA */}
                          {selectedAnalisisDetalle.model_response && (
                            <div>
                              <h4 className="text-lg font-medium text-blue-400 mb-3 flex items-center">
                                🤖 Análisis con Inteligencia Artificial
                              </h4>
                              <div className="bg-blue-900/20 rounded-lg p-4 border-l-4 border-blue-400">
                                <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                                  {selectedAnalisisDetalle.model_response}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Imágenes */}
                          <div>
                            <h4 className="text-lg font-medium text-green-400 mb-3">Imágenes del Análisis</h4>
                            {selectedAnalisisDetalle.path_foto ? (
                              <div>
                                <div className="text-xs text-gray-500 mb-2">
                                  Carpeta: {selectedAnalisisDetalle.path_foto}
                                </div>
                                <AnalisisImagenes carpeta={selectedAnalisisDetalle.path_foto} />
                              </div>
                            ) : (
                              <div className="text-center text-gray-400">
                                Este análisis no tiene imágenes asociadas
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer del modal */}
                    <div className="border-t border-gray-700 px-6 py-4 bg-gray-800/50">
                      <div className="flex justify-between">
                        <button
                          type="button"
                          className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => selectedAnalisisDetalle && handleEliminarAnalisis(selectedAnalisisDetalle.id)}
                          disabled={eliminandoAnalisis}
                        >
                          {eliminandoAnalisis ? 'Eliminando...' : '🗑️ Eliminar Análisis'}
                        </button>
                        <button
                          type="button"
                          className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                          onClick={() => setShowDetalleModal(false)}
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

        {/* Modal de resultados del análisis IA */}
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
                          <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-400">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423L16.5 15.75l.394 1.183a2.25 2.25 0 001.423 1.423L19.5 18.75l-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                            </svg>
                          </div>
                          <div>
                            <Dialog.Title as="h3" className="text-xl font-semibold text-blue-400">
                              Análisis con Inteligencia Artificial
                            </Dialog.Title>
                            <p className="text-sm text-gray-400">
                              Cultivo: {parcela?.cultivo} • {parcela?.ha} ha
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
                      {analisisIA ? (
                        <div className="prose prose-invert max-w-none">
                          <div className="bg-gray-700/50 rounded-lg p-4 border-l-4 border-blue-400 mb-4">
                            <div className="text-blue-400 font-medium mb-2 flex items-center">
                              🤖 Respuesta del Assistant IA
                            </div>
                            <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                              {analisisIA}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-400">
                          No hay análisis disponible
                        </div>
                      )}
                    </div>

                    {/* Footer del modal */}
                    <div className="border-t border-gray-700 px-6 py-4 bg-gray-800/50">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          <span className="inline-flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                            </svg>
                            Este análisis ha sido generado automáticamente y se ha guardado en el historial
                          </span>
                        </div>
                        <button
                          type="button"
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
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

        {/* Loading */}
        {loading && <SimpleLoading message="Cargando detalles de la parcela..." />}
      </div>
    </Layout>
  );
}