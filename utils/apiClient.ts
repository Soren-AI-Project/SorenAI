// Cliente API seguro para llamadas al servidor
import { supabase } from './supabaseClient';

export class ApiClient {
  // Usar la variable de entorno NEXT_PUBLIC_BACKEND_URL o caer en '/api' si no está definida
  private static baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '/api';

  // Método privado para obtener el token de autorización
  private static async getAuthToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }

  // Método privado para crear headers con autenticación
  private static async getAuthHeaders() {
    const token = await this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  static async obtenerParcelas(userType: string, userId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/parcelas?userType=${encodeURIComponent(userType)}&userId=${encodeURIComponent(userId)}`
      );
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo parcelas:', error);
      throw error;
    }
  }

  static async obtenerDatosDashboard(userType: string, userId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/dashboard?userType=${encodeURIComponent(userType)}&userId=${encodeURIComponent(userId)}`
      );
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo datos del dashboard:', error);
      throw error;
    }
  }

  static async obtenerMensajes(userType: string, userId: string, tipo: 'entrantes' | 'salientes') {
    try {
      const response = await fetch(
        `${this.baseUrl}/mensajes?userType=${encodeURIComponent(userType)}&userId=${encodeURIComponent(userId)}&tipo=${tipo}`
      );
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo mensajes:', error);
      throw error;
    }
  }

  static async contarMensajesNoLeidos(userType: string, userId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/mensajes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userType, userId }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error contando mensajes no leídos:', error);
      throw error;
    }
  }

  static async obtenerDetalleParcela(userType: string, userId: string, parcelaId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/parcelas/${encodeURIComponent(parcelaId)}?userType=${encodeURIComponent(userType)}&userId=${encodeURIComponent(userId)}`
      );
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo detalle de parcela:', error);
      throw error;
    }
  }

  static async obtenerTecnicos() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/tecnicos`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo técnicos:', error);
      throw error;
    }
  }

  static async crearTecnico(tecnicoData: { nombre: string; email: string; password: string }) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/tecnicos`, {
        method: 'POST',
        headers,
        body: JSON.stringify(tecnicoData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creando técnico:', error);
      throw error;
    }
  }

  static async obtenerPerfilUsuario(userId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/profile?userId=${encodeURIComponent(userId)}`
      );
      
      if (response.status === 404) {
        // 404 es válido - significa que el usuario no se encontró en ninguna tabla
        return { userProfile: null };
      }
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo perfil de usuario:', error);
      throw error;
    }
  }

  static async obtenerAgricultores(tecnicoId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/agricultores?tecnicoId=${encodeURIComponent(tecnicoId)}`
      );
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo agricultores:', error);
      throw error;
    }
  }

  static async crearParcela(parcelaData: { 
    cultivo: string; 
    hectareas: number; 
    agricultorId: string; 
    tecnicoId: string; 
  }) {
    try {
      const response = await fetch(`${this.baseUrl}/parcelas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parcelaData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creando parcela:', error);
      throw error;
    }
  }

  static async analizarConIA(parcelaId: string, userType: string, userId: string) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/analisis/analizar`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          parcelaId,
          userType,
          userId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error analizando con IA:', error);
      throw error;
    }
  }

  static async crearAnalisis(parcelaId: string, ph: string, conductividad: string, fotos: File[], userType: string, userId: string) {
    try {
      // Usar FormData para enviar archivos correctamente
      const formData = new FormData();
      
      // Agregar datos del análisis
      formData.append('parcelaId', parcelaId);
      formData.append('ph', ph);
      formData.append('conductividad', conductividad);
      formData.append('userType', userType);
      formData.append('userId', userId);
      
      // Agregar cada foto al FormData
      fotos.forEach((foto, index) => {
        formData.append(`foto_${index}`, foto, foto.name);
      });

      const headers = await this.getAuthHeaders();
      // No incluir Content-Type para FormData - el navegador lo establecerá automáticamente
      const { 'Content-Type': _, ...headersWithoutContentType } = headers;
      
      const response = await fetch(`${this.baseUrl}/analisis`, {
        method: 'POST',
        headers: headersWithoutContentType,
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creando análisis:', error);
      throw error;
    }
  }

  static async obtenerAnalisis(userType: string, userId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/analisis?userType=${encodeURIComponent(userType)}&userId=${encodeURIComponent(userId)}`
      );
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo análisis:', error);
      throw error;
    }
  }

  static async eliminarAnalisis(analisisId: string, userType: string, userId: string) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/analisis/${encodeURIComponent(analisisId)}`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({
          userType,
          userId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error eliminando análisis:', error);
      throw error;
    }
  }
} 