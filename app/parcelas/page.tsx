"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "../../components/Layout";
import { useMensajes } from "../../utils/MensajesContext";

interface Agricultor {
  id: string;
  nombre: string;
}

interface Tecnico {
  id: string;
  nombre: string;
}

// Interfaces para respuestas de Supabase
interface TecnicoBasico {
  id: string;
}

interface Parcela {
  id: string;
  cultivo: string;
  ha: number;
  agricultor: Agricultor;
  tecnico?: Tecnico;
  estado?: boolean;
}

interface NuevaParcela {
  cultivo: string;
  ha: number;
  id_agricultor: string;
}

export default function ParcelasPage() {
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userProfile, setUserProfile] = useState<"admin" | "tecnico" | "agricultor" | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [nuevaParcela, setNuevaParcela] = useState<NuevaParcela>({
    cultivo: "",
    ha: 0,
    id_agricultor: ""
  });
  const [agricultoresDisponibles, setAgricultoresDisponibles] = useState<Agricultor[]>([]);
  const [creatingParcela, setCreatingParcela] = useState(false);
  const [errorCreacion, setErrorCreacion] = useState("");
  const router = useRouter();
  const { userProfile: perfil } = useMensajes();

  // Cargar los agricultores disponibles según el perfil del usuario
  const cargarAgricultores = async () => {
    try {
      if (!perfil) return;

      let query;
      
      if (perfil.tipo === 'tecnico') {
        // Si es técnico, obtener sus agricultores asignados
        query = supabase
          .from('agricultor')
          .select('id, nombre')
          .eq('id_tecnico', perfil.id);
      } else if (perfil.tipo === 'admin') {
        // Primero obtenemos los técnicos asociados al admin
        const { data: tecnicos } = await supabase
          .from('tecnico')
          .select('id')
          .eq('id_admin', perfil.id);
        
        if (!tecnicos || tecnicos.length === 0) {
          setAgricultoresDisponibles([]);
          return;
        }
        
        const tecnicoIds = tecnicos.map((t: TecnicoBasico) => t.id);
        
        // Luego obtenemos los agricultores asignados a esos técnicos
        query = supabase
          .from('agricultor')
          .select('id, nombre')
          .in('id_tecnico', tecnicoIds);
      } else if (perfil.tipo === 'agricultor') {
        // Si es agricultor, solo puede ver sus propias parcelas
        query = supabase
          .from('agricultor')
          .select('id, nombre')
          .eq('id', perfil.id);
      } else {
        // Para otros perfiles no hay agricultores disponibles
        return;
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error al cargar agricultores:', error);
        return;
      }
      
      setAgricultoresDisponibles(data || []);
      
      // Si hay agricultores, seleccionar el primero por defecto
      if (data && data.length > 0) {
        setNuevaParcela(prev => ({
          ...prev,
          id_agricultor: data[0].id
        }));
      }
    } catch (error) {
      console.error('Error al cargar agricultores:', error);
    }
  };

  // Función para crear una nueva parcela
  const crearParcela = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCreacion("");
    setCreatingParcela(true);
    
    try {
      if (!nuevaParcela.cultivo || nuevaParcela.ha <= 0 || !nuevaParcela.id_agricultor) {
        setErrorCreacion("Por favor, completa todos los campos correctamente.");
        setCreatingParcela(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('parcela')
        .insert([
          {
            cultivo: nuevaParcela.cultivo,
            ha: nuevaParcela.ha,
            id_agricultor: nuevaParcela.id_agricultor,
            estado: true
          }
        ])
        .select();
      
      if (error) {
        console.error('Error al crear parcela:', error);
        setErrorCreacion("Error al crear la parcela. Por favor, inténtalo de nuevo.");
        setCreatingParcela(false);
        return;
      }
      
      // Resetear el formulario y cerrar el modal
      setNuevaParcela({
        cultivo: "",
        ha: 0,
        id_agricultor: agricultoresDisponibles.length > 0 ? agricultoresDisponibles[0].id : ""
      });
      setShowModal(false);
      
      // Recargar las parcelas
      await fetchParcelas();
      
    } catch (error) {
      console.error('Error al crear parcela:', error);
      setErrorCreacion("Error inesperado. Por favor, inténtalo de nuevo.");
    } finally {
      setCreatingParcela(false);
    }
  };

  useEffect(() => {
    if (perfil) {
      setUserProfile(perfil.tipo as any);
      cargarAgricultores();
    }
  }, [perfil]);

  const fetchParcelas = async () => {
    setLoading(true);
    setError("");
    
    try {
      if (!perfil) {
        setError("No se ha detectado un perfil de usuario");
        setLoading(false);
        return;
      }

      // Diferentes consultas según el tipo de usuario
      if (perfil.tipo === 'agricultor') {
        // Si es agricultor, solo ver sus propias parcelas
        const { data: parcelasData, error: parcelasError } = await supabase
          .from('parcela')
          .select(`
            id, 
            cultivo, 
            ha, 
            estado,
            agricultor:id_agricultor (
              id, 
              nombre
            )
          `)
          .eq('id_agricultor', perfil.id);

        if (parcelasError) {
          console.error("Error al cargar parcelas:", parcelasError);
          setError("Error al cargar las parcelas");
          setLoading(false);
          return;
        }

        // Transformar los datos para que coincidan con la interfaz Parcela
        const parcelasFormateadas = parcelasData?.map(p => ({
          id: p.id,
          cultivo: p.cultivo,
          ha: p.ha,
          agricultor: Array.isArray(p.agricultor) ? p.agricultor[0] : p.agricultor,
          estado: true
        })) || [];

        setParcelas(parcelasFormateadas);
        setLoading(false);
        return;
      } 
      else if (perfil.tipo === 'tecnico') {
        // Es técnico: buscar agricultores asociados y sus parcelas
        const { data: agricultores, error: agricultoresError } = await supabase
          .from('agricultor')
          .select('id, nombre')
          .eq('id_tecnico', perfil.id);

        if (agricultoresError) {
          console.error("Error al cargar agricultores:", agricultoresError);
          setError("Error al cargar los agricultores");
          setLoading(false);
          return;
        }

        const agricultorIds = agricultores?.map(a => a.id) || [];
        if (agricultorIds.length === 0) {
          setParcelas([]);
          setLoading(false);
          return;
        }

        // Obtener parcelas con información detallada
        const { data: parcelasData, error: parcelasError } = await supabase
          .from('parcela')
          .select(`
            id, 
            cultivo, 
            ha, 
            estado,
            agricultor:id_agricultor (
              id, 
              nombre
            )
          `)
          .in('id_agricultor', agricultorIds);

        if (parcelasError) {
          console.error("Error al cargar parcelas:", parcelasError);
          setError("Error al cargar las parcelas");
          setLoading(false);
          return;
        }

        // Transformar los datos para que coincidan con la interfaz Parcela
        const parcelasFormateadas = parcelasData?.map(p => {
          // Buscar el agricultor completo en la lista
          const agricultor = agricultores.find(a => a.id === (Array.isArray(p.agricultor) ? 
            (p.agricultor as any[])[0]?.id : 
            (p.agricultor as any)?.id));
          
          return {
            id: p.id,
            cultivo: p.cultivo,
            ha: p.ha,
            agricultor: agricultor || (Array.isArray(p.agricultor) ? p.agricultor[0] : p.agricultor),
            tecnico: { id: perfil.id, nombre: "Yo" },
            estado: true
          };
        }) || [];

        setParcelas(parcelasFormateadas);
        setLoading(false);
        return;
      } 
      else if (perfil.tipo === 'admin') {
        // Es admin: buscar técnicos asociados y sus agricultores
        const { data: tecnicos, error: tecnicosError } = await supabase
          .from('tecnico')
          .select('id, nombre')
          .eq('id_admin', perfil.id);

        if (tecnicosError) {
          console.error("Error al cargar técnicos:", tecnicosError);
          setError("Error al cargar los técnicos");
          setLoading(false);
          return;
        }

        const tecnicoIds = tecnicos?.map(t => t.id) || [];
        if (tecnicoIds.length === 0) {
          setParcelas([]);
          setLoading(false);
          return;
        }

        // Buscar agricultores asignados a esos técnicos
        const { data: agricultores, error: agricultoresError } = await supabase
          .from('agricultor')
          .select('id, nombre, id_tecnico')
          .in('id_tecnico', tecnicoIds);

        if (agricultoresError) {
          console.error("Error al cargar agricultores:", agricultoresError);
          setError("Error al cargar los agricultores");
          setLoading(false);
          return;
        }

        const agricultorIds = agricultores?.map(a => a.id) || [];
        if (agricultorIds.length === 0) {
          setParcelas([]);
          setLoading(false);
          return;
        }

        // Buscar parcelas de esos agricultores
        const { data: parcelasData, error: parcelasError } = await supabase
          .from('parcela')
          .select(`
            id, 
            cultivo, 
            ha, 
            id_agricultor,
            estado,
            agricultor:id_agricultor (
              id, 
              nombre
            )
          `)
          .in('id_agricultor', agricultorIds);

        if (parcelasError) {
          console.error("Error al cargar parcelas:", parcelasError);
          setError("Error al cargar las parcelas");
          setLoading(false);
          return;
        }

        // Transformar los datos para que coincidan con la interfaz Parcela
        const parcelasFormateadas = parcelasData?.map(p => {
          // Encontrar el agricultor correspondiente con su información completa
          const agricultor = agricultores?.find(a => a.id === p.id_agricultor);
          // Encontrar el técnico correspondiente
          const tecnico = tecnicos?.find(t => t.id === agricultor?.id_tecnico);
          
          return {
            id: p.id,
            cultivo: p.cultivo,
            ha: p.ha,
            agricultor: Array.isArray(p.agricultor) ? p.agricultor[0] : p.agricultor,
            tecnico: tecnico || undefined,
            estado: true
          };
        }) || [];

        setParcelas(parcelasFormateadas);
        setLoading(false);
        return;
      }

      setError("No tienes perfil asignado o no tienes acceso a parcelas");
      setLoading(false);
    } catch (err) {
      console.error("Error al cargar parcelas:", err);
      setError("Error al cargar las parcelas");
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (perfil) {
      fetchParcelas();
    }
  }, [perfil]);

  // Mostrar u ocultar el botón de nueva parcela según el perfil
  const mostrarBotonNuevaParcela = userProfile === 'admin' || userProfile === 'tecnico';

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-green-400">Tus parcelas</h1>
           
          {mostrarBotonNuevaParcela && (
            <button 
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 cursor-pointer flex items-center"
              onClick={() => {
                setShowModal(true);
                cargarAgricultores();
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nueva Parcela
            </button>
          )}
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-white text-xl">Cargando parcelas...</div>
          </div>
        ) : error ? (
          <div className="bg-red-900/40 border border-red-800 text-red-300 px-4 py-3 rounded relative text-sm">
            {error}
          </div>
        ) : parcelas.length === 0 ? (
          <div className="bg-gray-800 rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 text-lg mb-2">No se encontraron parcelas</div>
            <p className="text-gray-500">
              {userProfile === "tecnico" 
                ? "No tienes agricultores asignados o tus agricultores no tienen parcelas registradas." 
                : userProfile === "admin"
                ? "No hay parcelas registradas para los técnicos que administras."
                : "No tienes parcelas registradas en el sistema."}
            </p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Cultivo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Hectáreas
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Agricultor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {parcelas.map((parcela) => (
                  <tr key={parcela.id} className="hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{parcela.cultivo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{parcela.ha} ha</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{parcela.agricultor?.nombre || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${parcela.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {parcela.estado ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        href={`/parcelas/${parcela.id}`} 
                        className="text-green-400 hover:text-green-300 mr-4"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Modal para crear parcela */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 shadow-xl max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-green-400">Nueva Parcela</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={crearParcela}>
                <div className="mb-4">
                  <label htmlFor="cultivo" className="block text-gray-300 mb-2">Tipo de Cultivo</label>
                  <input
                    type="text"
                    id="cultivo"
                    className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={nuevaParcela.cultivo}
                    onChange={(e) => setNuevaParcela({...nuevaParcela, cultivo: e.target.value})}
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="ha" className="block text-gray-300 mb-2">Hectáreas</label>
                  <input
                    type="number"
                    id="ha"
                    min="0.1"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={nuevaParcela.ha || ''}
                    onChange={(e) => setNuevaParcela({...nuevaParcela, ha: parseFloat(e.target.value) || 0})}
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label htmlFor="agricultor" className="block text-gray-300 mb-2">Agricultor</label>
                  {agricultoresDisponibles.length > 0 ? (
                    <select
                      id="agricultor"
                      className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      value={nuevaParcela.id_agricultor}
                      onChange={(e) => setNuevaParcela({...nuevaParcela, id_agricultor: e.target.value})}
                      required
                    >
                      {agricultoresDisponibles.map(agricultor => (
                        <option key={agricultor.id} value={agricultor.id}>
                          {agricultor.nombre}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-red-400 text-sm">
                      No hay agricultores disponibles para asignar una parcela.
                    </div>
                  )}
                </div>
                
                {errorCreacion && (
                  <div className="bg-red-900/40 border border-red-800 text-red-300 px-4 py-3 rounded relative text-sm mb-4">
                    {errorCreacion}
                  </div>
                )}
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 cursor-pointer mr-3"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creatingParcela || agricultoresDisponibles.length === 0}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingParcela ? 'Creando...' : 'Crear Parcela'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 