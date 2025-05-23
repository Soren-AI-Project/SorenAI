'use client';

import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../utils/useAuth";
import { ApiClient } from "../../../utils/apiClient";
import Layout from "../../../components/Layout";

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

export default function DetalleParcelaPage() {
  const [parcela, setParcela] = useState<Parcela | null>(null);
  const [analiticas, setAnaliticas] = useState<Analitica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({
    cultivo: "",
    ha: 0,
    estado: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const params = useParams();
  const parcelaId = params.id as string;

  useAuth(setUserProfile);

  // Cargar detalles de la parcela usando la API segura
  useEffect(() => {
    const fetchParcelaDetail = async () => {
      if (!parcelaId || !userProfile) return;
      
      setLoading(true);
      setError("");
      
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

  const handleDelete = async () => {
    // Funcionalidad de eliminación (por implementar en API si se necesita)
    setIsModalOpen(false);
  };

  const handleEdit = async () => {
    // Funcionalidad de edición (por implementar en API si se necesita)
    setIsEditModalOpen(false);
  };

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
                Análisis #{analitica.id}
              </h4>
              <span className="text-sm text-gray-400">
                {analitica.fecha}
              </span>
            </div>
            
            {analitica.resultado && (
              <div className="mb-3">
                <p className="text-gray-300">{analitica.resultado}</p>
              </div>
            )}
            
            {analitica.path_foto && (
              <div className="mb-3">
                <img 
                  src={analitica.path_foto} 
                  alt="Análisis" 
                  className="max-w-full h-auto rounded border"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8 text-center text-green-500">Cargando detalles de la parcela...</div>
      </Layout>
    );
  }

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
      <div className="max-w-6xl mx-auto">
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
            {userProfile?.tipo === 'admin' && (
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
              {parcela.tecnico && (
                <div>
                  <span className="text-gray-400">Técnico:</span>
                  <span className="ml-2 text-white">{parcela.tecnico.nombre}</span>
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
            <button
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 flex items-center cursor-pointer"
              onClick={() => {
                // Aquí puedes implementar la lógica para realizar un análisis
                // Por ejemplo: router.push(`/parcelas/${parcela.id}/analizar`);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
              </svg>
              Realizar análisis
            </button>
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
                      Editar Parcela
                    </Dialog.Title>
                    
                    <div className="space-y-4">
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
                    </div>

                    <div className="mt-6 flex gap-2">
                      <button
                        type="button"
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer"
                        onClick={handleEdit}
                        disabled={isSaving}
                      >
                        {isSaving ? 'Guardando...' : 'Guardar'}
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
      </div>
    </Layout>
  );
}