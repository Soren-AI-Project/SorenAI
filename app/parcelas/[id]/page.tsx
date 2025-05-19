'use client';

import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { supabase } from "../../../utils/supabaseClient";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

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
  tecnico?: Tecnico;
  // Datos adicionales para la vista detallada
  fechaPlantacion?: string;
  estado?: string;
  ultimoAnalisis?: string;
}

export default function DetalleParcelaPage() {
  const [parcela, setParcela] = useState<Parcela | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userProfile, setUserProfile] = useState<"admin" | "tecnico" | null>(null);
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
    const fetchParcelaDetail = async () => {
      if (!parcelaId) return;
      
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

        // 2. Verificar si es técnico
        const { data: tecnico } = await supabase
          .from('tecnico')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (tecnico) {
          setUserProfile("tecnico");
          
          // Obtener los agricultores asignados al técnico
          const { data: agricultores } = await supabase
            .from('agricultor')
            .select('id')
            .eq('id_tecnico', tecnico.id);

          const agricultorIds = agricultores?.map(a => a.id) || [];
          
          // Obtener la parcela con su agricultor
          const { data: parcelaData, error: parcelaError } = await supabase
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
            .eq('id', parcelaId)
            .single();

          if (parcelaError) {
            setError("No se encontró la parcela");
            setLoading(false);
            return;
          }

          // Extraer el agricultor (que puede venir como array o como objeto)
          const agricultor = Array.isArray(parcelaData.agricultor) 
            ? parcelaData.agricultor[0] 
            : parcelaData.agricultor;

          // Verificar si el técnico tiene acceso a esta parcela
          if (!agricultor || !agricultorIds.includes(agricultor.id)) {
            setError("No tienes permiso para ver esta parcela");
            setLoading(false);
            return;
          }
          
          // Datos simulados adicionales para la vista detallada
          const parcelaDetallada = {
            id: parcelaData.id,
            cultivo: parcelaData.cultivo,
            ha: parcelaData.ha,
            agricultor: agricultor,
            fechaPlantacion: "15/03/2023",
            estado: "Activo",
            ubicacion: "40.4168° N, 3.7038° W",
            ultimoAnalisis: "27/05/2023"
          };

          setParcela(parcelaDetallada);
          setEditData({
            cultivo: parcelaDetallada.cultivo,
            ha: parcelaDetallada.ha,
            estado: parcelaDetallada.estado === "Activo",
          });
          setLoading(false);
          return;
        }

        // 3. Verificar si es admin
        const { data: admin } = await supabase
          .from('admin')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (admin) {
          setUserProfile("admin");
          
          // Obtener los técnicos asociados a este admin
          const { data: tecnicos } = await supabase
            .from('tecnico')
            .select('id, nombre')
            .eq('id_admin', admin.id);

          const tecnicoIds = tecnicos?.map(t => t.id) || [];
          
          // Obtener los agricultores asociados a estos técnicos
          const { data: agricultores } = await supabase
            .from('agricultor')
            .select('id, id_tecnico, nombre')
            .in('id_tecnico', tecnicoIds);

          // Obtener la parcela
          const { data: parcelaData, error: parcelaError } = await supabase
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
            .eq('id', parcelaId)
            .single();

          if (parcelaError) {
            setError("No se encontró la parcela");
            setLoading(false);
            return;
          }

          // Buscar el agricultor y el técnico relacionados
          const agricultor = Array.isArray(parcelaData.agricultor) 
            ? parcelaData.agricultor[0] 
            : parcelaData.agricultor;
          
          const agricultorCompleto = agricultores?.find(a => a.id === agricultor.id);
          const tecnicoRelacionado = tecnicos?.find(t => t.id === agricultorCompleto?.id_tecnico);
          // Datos simulados adicionales para la vista detallada
          const parcelaDetallada = {
            id: parcelaData.id,
            cultivo: parcelaData.cultivo,
            ha: parcelaData.ha,
            agricultor: agricultor,
            tecnico: tecnicoRelacionado 
              ? { id: tecnicoRelacionado.id, nombre: tecnicoRelacionado.nombre }
              : undefined,
            fechaPlantacion: "15/03/2023",
            estado: parcelaData.estado === true ? "Activo" : "Inactivo",
            ultimoAnalisis: "27/05/2023"
          };

          setParcela(parcelaDetallada);
          setEditData({
            cultivo: parcelaDetallada.cultivo,
            ha: parcelaDetallada.ha,
            estado: parcelaDetallada.estado === "Activo",
          });
          setLoading(false);
          return;
        }

        setError("No tienes perfil asignado");
      } catch (err) {
        console.error("Error al cargar la parcela:", err);
        setError("Error al cargar los datos de la parcela");
      } finally {
        setLoading(false);
      }
    };
    
    fetchParcelaDetail();
  }, [parcelaId, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleDelete = async () => {
    if (!parcelaId) return;

    try {
      const { error } = await supabase
        .from('parcela')
        .delete()
        .eq('id', parcelaId);

      if (error) {
        console.error("Error al eliminar la parcela:", error);
        setIsModalOpen(false);
        return;
      }

      setIsModalOpen(false);
      router.push('/parcelas');
    } catch (err) {
      console.error("Error al eliminar la parcela:", err);
      setIsModalOpen(false);
    }
  };

  const handleEdit = async () => {
    if (!parcelaId) return;

    setIsSaving(true);
    try {
      const { data: updatedParcela, error } = await supabase
        .from('parcela')
        .update({
          cultivo: editData.cultivo,
          ha: editData.ha,
          estado: editData.estado,
        })
        .eq('id', parcelaId)
        .select()
        .single();

      if (error) {
        console.error("Error al editar la parcela:", error);
        setIsSaving(false);
        return;
      }

      // Actualizar el estado de la parcela manualmente
      if (updatedParcela) {
        setParcela((prevParcela) => prevParcela ? ({
                  ...prevParcela,
                  cultivo: updatedParcela.cultivo,
                  ha: updatedParcela.ha,
                  estado: updatedParcela.estado ? "Activo" : "Inactivo",
                }) : null);
      }

      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Error al editar la parcela:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Modal de confirmación */}
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
            <div className="fixed inset-0 bg-black/50" />
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
                    className="text-lg font-medium leading-6 text-white"
                  >
                    Confirmar eliminación
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-400">
                      ¿Estás seguro de que deseas eliminar esta parcela? Esta acción no se puede deshacer.
                    </p>
                  </div>

                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      onClick={handleDelete}
                    >
                      Eliminar
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
            <div className="fixed inset-0 bg-black/50" />
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
                    className="text-lg font-medium leading-6 text-white"
                  >
                    Editar Parcela
                  </Dialog.Title>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Cultivo</label>
                      <input
                        type="text"
                        value={editData.cultivo}
                        onChange={(e) => setEditData({ ...editData, cultivo: e.target.value })}
                        className="appearance-none relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-500 text-white rounded-md bg-gray-700 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm autofill:bg-gray-700 autofill:text-white"
                        placeholder="Cultivo"
                        style={{ WebkitTextFillColor: 'white', WebkitBoxShadow: '0 0 0px 1000px #374151 inset' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Hectáreas</label>
                      <input
                        type="number"
                        value={editData.ha}
                        onChange={(e) => setEditData({ ...editData, ha: parseFloat(e.target.value) })}
                        className="appearance-none relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-500 text-white rounded-md bg-gray-700 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm autofill:bg-gray-700 autofill:text-white"
                        placeholder="Hectáreas"
                        style={{ WebkitTextFillColor: 'white', WebkitBoxShadow: '0 0 0px 1000px #374151 inset' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Estado</label>
                      <select
                        value={editData.estado ? "Activo" : "Inactivo"}
                        onChange={(e) => setEditData({ ...editData, estado: e.target.value === "Activo" })}
                        className="appearance-none relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-500 text-white rounded-md bg-gray-700 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                      >
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      onClick={() => setIsEditModalOpen(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center justify-center"
                      onClick={handleEdit}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          ></path>
                        </svg>
                      ) : (
                        "Guardar"
                      )}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

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
              <h1 className="text-3xl font-bold text-green-400">Detalle de Parcela</h1>
              <Link href="/parcelas" className="flex items-center text-gray-300 hover:text-green-400 bg-gray-800 px-4 py-2 rounded-md transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Volver
              </Link>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-white text-xl">Cargando datos de la parcela...</div>
              </div>
            ) : error ? (
              <div className="bg-red-900/40 border border-red-800 text-red-300 px-4 py-3 rounded relative text-sm">
                {error}
              </div>
            ) : parcela ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tarjeta principal */}
                <div className="md:col-span-2 bg-gray-800 rounded-lg shadow overflow-hidden">
                  <div className="p-6 border-b border-gray-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-2">{parcela.cultivo}</h2>
                      </div>
                      <div
                        className={`px-4 py-2 rounded-md border ${
                          parcela.estado === "Activo"
                            ? "bg-green-800/30 text-green-400 border-green-800/50"
                            : "bg-red-800/30 text-red-400 border-red-800/50"
                        }`}
                      >
                        {parcela.estado || "Activo"}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-300 mb-4">Información General</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Hectáreas:</span>
                        <span className="text-white font-medium">{parcela.ha} ha</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Fecha de plantación:</span>
                        <span className="text-white font-medium">{parcela.fechaPlantacion}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Último análisis:</span>
                        <span className="text-white font-medium">{parcela.ultimoAnalisis}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 border-t border-gray-700">
                    <h3 className="text-lg font-medium text-gray-300 mb-4">Acciones</h3>
                    <div className="flex flex-wrap gap-3">
                      <button className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 cursor-pointer flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
                        </svg>
                        Realizar análisis
                      </button>
                      <button 
                        onClick={() => setIsEditModalOpen(true)}
                        className="px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 cursor-pointer flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        Editar parcela
                      </button>
                      <button 
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 border border-red-900 text-sm font-medium rounded-md text-red-400 hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-colors duration-200 cursor-pointer flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Tarjeta de personas asociadas */}
                <div className="bg-gray-800 rounded-lg shadow">
                  <div className="p-6 border-b border-gray-700">
                    <h3 className="text-lg font-medium text-gray-300">Personas Asociadas</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div>
                        <span className="text-gray-400 block mb-1">Agricultor:</span>
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-green-900/30 flex items-center justify-center mr-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-400">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                          </div>
                          <span className="text-white font-medium">{parcela.agricultor?.nombre || "-"}</span>
                        </div>
                      </div>
                      
                      {userProfile === "admin" && parcela.tecnico && (
                        <div>
                          <span className="text-gray-400 block mb-1">Técnico:</span>
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center mr-2">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877a2.25 2.25 0 00-3.182 0L11.42 15.17zM6 9l4.5 4.5L21 6" />
                              </svg>
                            </div>
                            <span className="text-white font-medium">{parcela.tecnico.nombre}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Historial de actividad */}
                  <div className="p-6 border-t border-gray-700">
                    <h3 className="text-lg font-medium text-gray-300 mb-4">Actividad reciente</h3>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="h-8 w-8 rounded-full bg-green-900/30 flex items-center justify-center mr-3 mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-gray-300">Análisis completado</div>
                          <div className="text-sm text-gray-500">Hace 2 días</div>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="h-8 w-8 rounded-full bg-blue-900/30 flex items-center justify-center mr-3 mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-gray-300">Nueva recomendación</div>
                          <div className="text-sm text-gray-500">Hace 4 días</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg shadow p-8 text-center">
                <div className="text-gray-400 text-lg">No se encontró la parcela</div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}