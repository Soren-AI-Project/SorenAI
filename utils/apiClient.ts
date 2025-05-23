// Cliente API seguro para llamadas al servidor
export class ApiClient {
  // Usar la variable de entorno NEXT_PUBLIC_BACKEND_URL o caer en '/api' si no está definida
  private static baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '/api';

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

  static async obtenerTecnicos(userType: string, userId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/tecnicos?userType=${encodeURIComponent(userType)}&userId=${encodeURIComponent(userId)}`
      );
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo técnicos:', error);
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
} 