'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '../utils/apiClient';

interface Agricultor {
  id: string;
  nombre: string;
}

interface CrearParcelaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onParcelaCreada: (parcela: any) => void;
  tecnicoId: string;
}

export default function CrearParcelaModal({ 
  isOpen, 
  onClose, 
  onParcelaCreada, 
  tecnicoId 
}: CrearParcelaModalProps) {
  const [formData, setFormData] = useState({
    cultivo: '',
    hectareas: '',
    agricultorId: ''
  });
  const [agricultores, setAgricultores] = useState<Agricultor[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAgricultores, setLoadingAgricultores] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar agricultores cuando se abre el modal
  useEffect(() => {
    if (isOpen && tecnicoId) {
      cargarAgricultores();
    }
  }, [isOpen, tecnicoId]);

  const cargarAgricultores = async () => {
    setLoadingAgricultores(true);
    try {
      const response = await ApiClient.obtenerAgricultores(tecnicoId);
      setAgricultores(response.agricultores || []);
    } catch (error) {
      console.error('Error cargando agricultores:', error);
      setError('Error al cargar los agricultores');
    } finally {
      setLoadingAgricultores(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validaciones del lado del cliente
      if (!formData.cultivo.trim()) {
        throw new Error('El cultivo es requerido');
      }
      if (!formData.hectareas.trim()) {
        throw new Error('Las hectáreas son requeridas');
      }
      if (!formData.agricultorId) {
        throw new Error('Debe seleccionar un agricultor');
      }

      const hectareas = parseFloat(formData.hectareas);
      if (isNaN(hectareas) || hectareas <= 0) {
        throw new Error('Las hectáreas deben ser un número positivo');
      }

      // Crear parcela
      const result = await ApiClient.crearParcela({
        cultivo: formData.cultivo.trim(),
        hectareas: hectareas,
        agricultorId: formData.agricultorId,
        tecnicoId: tecnicoId
      });
      
      if (result.success) {
        // Notificar al componente padre
        onParcelaCreada(result.parcela);
        
        // Limpiar formulario y cerrar modal
        setFormData({ cultivo: '', hectareas: '', agricultorId: '' });
        onClose();
      } else {
        throw new Error(result.error || 'Error desconocido al crear parcela');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ cultivo: '', hectareas: '', agricultorId: '' });
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">Crear Nueva Parcela</h3>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-300 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Cultivo */}
            <div>
              <label htmlFor="cultivo" className="block text-sm font-medium text-gray-300 mb-2">
                Cultivo *
              </label>
              <input
                type="text"
                id="cultivo"
                name="cultivo"
                value={formData.cultivo}
                onChange={handleInputChange}
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50"
                placeholder="Ej: Maíz, Trigo, Tomate..."
              />
            </div>

            {/* Hectáreas */}
            <div>
              <label htmlFor="hectareas" className="block text-sm font-medium text-gray-300 mb-2">
                Hectáreas *
              </label>
              <input
                type="number"
                id="hectareas"
                name="hectareas"
                value={formData.hectareas}
                onChange={handleInputChange}
                required
                disabled={loading}
                min="0.1"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50"
                placeholder="Ej: 5.5"
              />
            </div>

            {/* Agricultor */}
            <div>
              <label htmlFor="agricultorId" className="block text-sm font-medium text-gray-300 mb-2">
                Agricultor *
              </label>
              {loadingAgricultores ? (
                <div className="text-gray-400 text-sm">Cargando agricultores...</div>
              ) : (
                <select
                  id="agricultorId"
                  name="agricultorId"
                  value={formData.agricultorId}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50"
                >
                  <option value="">Seleccionar agricultor</option>
                  {agricultores.map((agricultor) => (
                    <option key={agricultor.id} value={agricultor.id}>
                      {agricultor.nombre}
                    </option>
                  ))}
                </select>
              )}
              {!loadingAgricultores && agricultores.length === 0 && (
                <p className="text-sm text-gray-400 mt-1">
                  No hay agricultores asignados. Contacte con el administrador.
                </p>
              )}
            </div>
          </div>

          {/* Error mensaje */}
          {error && (
            <div className="mt-4 p-3 bg-red-900/40 border border-red-800 text-red-300 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 border border-gray-600 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || loadingAgricultores || agricultores.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 transition-colors flex items-center"
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? 'Creando...' : 'Crear Parcela'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 