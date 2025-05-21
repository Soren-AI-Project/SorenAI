"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../utils/supabaseClient";
import { useAuth } from "../../utils/useAuth";
import Layout from "../../components/Layout";

export default function TecnicosPage() {
  const router = useRouter();
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'listado'>('listado');

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
    const { data, error } = await supabase
      .from("tecnico")
      .select("id, nombre, email")
      .eq("admin_id", userProfile.id);
    if (!error) setTecnicos(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8 text-center text-green-500">Cargando técnicos...</div>
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
                  className="p-4 hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg text-gray-300">
                      {tecnico.nombre}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {tecnico.email}
                    </span>
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
