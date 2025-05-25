"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../utils/useAuth";
import { ApiClient } from "../../utils/apiClient";
import Layout from "../../components/Layout";
import CrearTecnicoModal from "../../components/CrearTecnicoModal";
import { supabase } from "../../utils/supabaseClient";

// Deshabilitar el prerenderizado estático para páginas que requieren autenticación
export const dynamic = 'force-dynamic';

interface Tecnico {
  id: string;
  nombre: string;
  email: string;
  totalParcelas: number;
  agricultoresAsignados: number;
}

export default function TecnicosPage() {
  const router = useRouter();
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'listado'>('listado');
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useAuth(setUserProfile);

  useEffect(() => {
    if (userProfile && userProfile.tipo !== "admin") {
      router.push("/dashboard");
      return;
    }
    if (userProfile && userProfile.tipo === "admin" && tecnicos.length === 0) {
      fetchTecnicos();
    }
    // eslint-disable-next-line
  }, [userProfile]); // Solo cargar si no tenemos datos

  const fetchTecnicos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiClient.obtenerTecnicos();
      if (response.success) {
        setTecnicos(response.tecnicos || []);
      } else {
        throw new Error(response.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error obteniendo técnicos:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar los técnicos. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalles = (tecnicoId: string) => {
    // Aquí puedes navegar a una página de detalles del técnico
    router.push(`/tecnicos/${tecnicoId}`);
  };

  const handleTecnicoCreado = (nuevoTecnico: Tecnico) => {
    // Agregar el nuevo técnico a la lista
    setTecnicos(prev => [...prev, nuevoTecnico]);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="flex items-center space-x-2">
            <svg className="animate-spin h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-green-500 text-lg">Cargando técnicos...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <div className="bg-red-900/40 border border-red-800 text-red-300 p-4 rounded-md mb-4">
            <div className="flex items-center justify-center mb-2">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Error al cargar técnicos
            </div>
            <p className="text-sm">{error}</p>
          </div>
          <button 
            onClick={fetchTecnicos}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-green-400">Técnicos</h1>
          <button 
            onClick={handleOpenModal}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 cursor-pointer flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nuevo Técnico
          </button>
        </div>

        {/* Pestañas */}
        <div className="flex border-b border-gray-700 mb-6">
          <button
            className={`px-4 py-2 font-medium text-sm focus:outline-none ${
              activeTab === 'listado'
                ? 'text-green-400 border-b-2 border-green-400 -mb-px'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('listado')}
          >
            Listado
          </button>
        </div>

        {/* Lista de técnicos */}
        <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
          {tecnicos.length === 0 ? (
            <div className="p-8 text-center">
              <div className="flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-500 mb-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <div className="text-gray-400 text-lg mb-2">No tienes técnicos registrados</div>
                <div className="text-gray-500 text-sm mb-4">Crea tu primer técnico para comenzar a gestionar tu equipo</div>
                <button
                  onClick={handleOpenModal}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200"
                >
                  Crear Primer Técnico
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {tecnicos.map((tecnico) => (
                <div 
                  key={tecnico.id} 
                  className="p-6 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    {/* Información del técnico */}
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <div className="w-10 h-10 rounded-full bg-green-900/30 flex items-center justify-center mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {tecnico.nombre}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {tecnico.email}
                          </p>
                        </div>
                      </div>
                      
                      {/* Estadísticas */}
                      <div className="flex gap-6 mt-3 ml-13">
                        <div className="flex items-center text-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-400 mr-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                          <span className="text-gray-300">
                            <span className="font-semibold text-white">{tecnico.totalParcelas}</span> parcelas
                          </span>
                        </div>
                        
                        <div className="flex items-center text-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-400 mr-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                          </svg>
                          <span className="text-gray-300">
                            <span className="font-semibold text-white">{tecnico.agricultoresAsignados}</span> agricultores
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Botón de acción */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => handleVerDetalles(tecnico.id)}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Ver detalles
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal para crear técnico */}
      <CrearTecnicoModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onTecnicoCreado={handleTecnicoCreado}
      />
    </Layout>
  );
}
