"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Agricultor {
  id: string;
  nombre: string;
}

interface Parcela {
  id: string;
  cultivo: string;
  ha: number;
  agricultor: Agricultor;
}

interface ParcelaResponse {
  id: string;
  cultivo: string;
  ha: number;
  agricultor: {
    id: string;
    nombre: string;
  };
}

export default function ParcelasPage() {
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userProfile, setUserProfile] = useState<"admin" | "tecnico" | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      
      if (!data.session) {
        router.push('/login');
        return;
      }
    };

    checkUser();
  }, [router]);

  useEffect(() => {
    const fetchParcelas = async () => {
      setLoading(true);
      setError("");
      try {
        // 1. Obtener usuario autenticado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("No autenticado");
          setLoading(false);
          return;
        }

        // 2. Buscar perfil técnico
        const { data: tecnico } = await supabase
          .from('tecnico')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (tecnico) {
          setUserProfile("tecnico");
          // Es técnico: buscar agricultores asociados y sus parcelas
          const { data: agricultores } = await supabase
            .from('agricultor')
            .select('id')
            .eq('id_tecnico', tecnico.id);

          const agricultorIds = agricultores?.map(a => a.id) || [];
          if (agricultorIds.length === 0) {
            setParcelas([]);
            setLoading(false);
            return;
          }

          const { data: parcelasData } = await supabase
            .from('parcela')
            .select(`
              id, 
              cultivo, 
              ha, 
              agricultor:id_agricultor (
                id, 
                nombre
              )
            `)
            .in('id_agricultor', agricultorIds);

          // Transformar los datos para que coincidan con la interfaz Parcela
          const parcelasFormateadas = parcelasData?.map(p => ({
            id: p.id,
            cultivo: p.cultivo,
            ha: p.ha,
            agricultor: Array.isArray(p.agricultor) ? p.agricultor[0] : p.agricultor
          })) || [];

          setParcelas(parcelasFormateadas);
          setLoading(false);
          return;
        }

        // 3. Buscar perfil admin
        const { data: admin } = await supabase
          .from('admin')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (admin) {
          setUserProfile("admin");
          // Es admin: buscar técnicos asociados
          const { data: tecnicos } = await supabase
            .from('tecnico')
            .select('id')
            .eq('id_admin', admin.id);

          const tecnicoIds = tecnicos?.map(t => t.id) || [];
          if (tecnicoIds.length === 0) {
            setParcelas([]);
            setLoading(false);
            return;
          }

          // Buscar agricultores de esos técnicos
          const { data: agricultores } = await supabase
            .from('agricultor')
            .select('id')
            .in('id_tecnico', tecnicoIds);

          const agricultorIds = agricultores?.map(a => a.id) || [];
          if (agricultorIds.length === 0) {
            setParcelas([]);
            setLoading(false);
            return;
          }

          // Buscar parcelas de esos agricultores
          const { data: parcelasData } = await supabase
            .from('parcela')
            .select(`
              id, 
              cultivo, 
              ha, 
              agricultor:id_agricultor (
                id, 
                nombre
              )
            `)
            .in('id_agricultor', agricultorIds);

          // Transformar los datos para que coincidan con la interfaz Parcela
          const parcelasFormateadas = parcelasData?.map(p => ({
            id: p.id,
            cultivo: p.cultivo,
            ha: p.ha,
            agricultor: Array.isArray(p.agricultor) ? p.agricultor[0] : p.agricultor
          })) || [];

          setParcelas(parcelasFormateadas);
          setLoading(false);
          return;
        }

        setError("No tienes perfil asignado");
      } catch (err) {
        console.error("Error al cargar parcelas:", err);
        setError("Error al cargar las parcelas");
      } finally {
        setLoading(false);
      }
    };
    
    fetchParcelas();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Header y sidebar igual que en dashboard
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 shadow-md z-10">
        <div className="w-full px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-14 h-14 mr-4 bg-green-900/30 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-8 h-8">
                <path d="M30 60 L30 80 L70 80 L70 60 Z" fill="#1e3a3a" />
                <rect x="28" y="80" width="44" height="5" rx="2" fill="#1a2e2e" />
                <ellipse cx="50" cy="85" rx="22" ry="3" fill="rgba(0,0,0,0.1)" />
                <path d="M50 60 L50 45" stroke="#2e9e6b" strokeWidth="2" fill="none" />
                <path d="M50 45 Q60 40 65 30 Q50 32 50 45" fill="#26ae7b" />
                <path d="M50 45 Q40 35 30 33 Q45 45 50 45" fill="#26ae7b" />
                <path d="M50 45 Q40 40 35 30 Q50 32 50 45" fill="#26ae7b" />
                <path d="M50 50 Q60 48 70 55 Q55 45 50 50" fill="#26ae7b" />
                <path d="M58 36 Q55 38 55 35" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />
                <path d="M42 38 Q45 40 45 37" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-green-400">Soren<span className="text-gray-400">AI</span></h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 cursor-pointer">
              Área Cliente
            </button>
            <button 
              onClick={handleSignOut}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 cursor-pointer"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="bg-gray-800 w-64 border-r border-gray-700 flex-shrink-0">
          <nav className="mt-6 px-4">
            <div className="space-y-4">
              <Link href="/dashboard" className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors group">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 text-gray-400 group-hover:text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                Inicio
              </Link>
              <Link href="/parcelas" className="flex items-center px-4 py-3 bg-gray-700 text-white rounded-md transition-colors group">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                Parcelas
              </Link>
              <Link href="/dashboard/mensajes" className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors group relative">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 text-gray-400 group-hover:text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                Mensajes
                <span className="absolute right-4 bg-green-600 text-white text-xs px-1.5 py-0.5 rounded-full">2</span>
              </Link>
            </div>
          </nav>
        </aside>
        {/* Contenido principal */}
        <main className="flex-1 overflow-y-auto py-8 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-green-400">Parcelas</h1>
              {userProfile && (
                <div className="px-4 py-2 bg-gray-800 rounded-md text-gray-300 text-sm">
                  Perfil: <span className="text-green-400 font-medium capitalize">{userProfile}</span>
                </div>
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
                    : "No hay parcelas registradas para los técnicos que administras."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {parcelas.map((parcela) => (
                  <div key={parcela.id} className="bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold text-white mb-2">{parcela.cultivo}</h2>
                    <div className="text-gray-400 mb-1">Hectáreas: {parcela.ha}</div>
                    <div className="text-gray-400">Agricultor: {parcela.agricultor?.nombre || "-"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
} 