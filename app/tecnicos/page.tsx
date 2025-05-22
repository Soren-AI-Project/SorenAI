"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../utils/useAuth";
import { ApiClient } from "../../utils/apiClient";
import Layout from "../../components/Layout";

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

  useAuth(setUserProfile);

  useEffect(() => {
    if (userProfile && userProfile.tipo !== "admin") {
      router.push("/dashboard");
    }
    if (userProfile && userProfile.tipo === "admin") {
      fetchTecnicos();
    }
    // eslint-disable-next-line
  }, [userProfile]);

  const fetchTecnicos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiClient.obtenerTecnicos(userProfile.tipo, userProfile.id);
      setTecnicos(response.tecnicos || []);
    } catch (error) {
      console.error('Error obteniendo técnicos:', error);
      setError('Error al cargar los técnicos. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalles = (tecnicoId: string) => {
    // Aquí puedes navegar a una página de detalles del técnico
    router.push(`/tecnicos/${tecnicoId}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8 text-center text-green-500">Cargando técnicos...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <div className="text-red-400 mb-4">{error}</div>
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
              <div className="text-gray-400">No tienes técnicos registrados</div>
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
    </Layout>
  );
}
