// Gestor de sesiones personalizado para manejar "Recordarme"
export class SessionManager {
  private static readonly REMEMBER_KEY = 'sorenai.remember';
  private static readonly SESSION_KEY = 'sorenai.session';
  private static readonly SESSION_TIMESTAMP_KEY = 'sorenai.session.timestamp';

  // Verificar si el usuario quiere ser recordado
  static getRememberPreference(): boolean {
    if (typeof window === 'undefined') return false;
    const preference = localStorage.getItem(this.REMEMBER_KEY);
    console.log('📖 Preferencia remember:', preference);
    return preference === 'true';
  }

  // Establecer preferencia de recordar
  static setRememberPreference(remember: boolean): void {
    if (typeof window === 'undefined') return;
    console.log('💾 Estableciendo remember:', remember);
    localStorage.setItem(this.REMEMBER_KEY, remember.toString());
  }

  // Guardar información de sesión
  static saveSessionInfo(userId: string, email: string): void {
    if (typeof window === 'undefined') return;
    
    const sessionData = {
      userId,
      email,
      timestamp: Date.now()
    };
    
    console.log('💾 Guardando información de sesión:', sessionData);
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
    localStorage.setItem(this.SESSION_TIMESTAMP_KEY, Date.now().toString());
  }

  // Obtener información de sesión guardada
  static getSavedSessionInfo(): { userId: string; email: string; timestamp: number } | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;
      
      const parsed = JSON.parse(sessionData);
      console.log('📖 Información de sesión guardada:', parsed);
      return parsed;
    } catch (error) {
      console.error('Error leyendo información de sesión:', error);
      return null;
    }
  }

  // Verificar si la sesión está expirada
  static isSessionExpired(): boolean {
    if (typeof window === 'undefined') return true;
    
    const rememberMe = this.getRememberPreference();
    const timestamp = localStorage.getItem(this.SESSION_TIMESTAMP_KEY);
    
    if (!timestamp) return true;
    
    const sessionTime = parseInt(timestamp);
    const now = Date.now();
    
    // Si el usuario marcó "recordarme", la sesión no expira
    if (rememberMe) {
      console.log('✅ Sesión no expira (remember=true)');
      return false;
    }
    
    // Si no marcó "recordarme", expira en 8 horas
    const eightHours = 8 * 60 * 60 * 1000;
    const expired = (now - sessionTime) > eightHours;
    
    console.log('⏰ Verificando expiración de sesión:', {
      sessionTime: new Date(sessionTime),
      now: new Date(now),
      expired,
      hoursElapsed: (now - sessionTime) / (60 * 60 * 1000)
    });
    
    return expired;
  }

  // Limpiar toda la información de sesión
  static clearSession(): void {
    if (typeof window === 'undefined') return;
    
    console.log('🗑️ Limpiando sesión local');
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.SESSION_TIMESTAMP_KEY);
    localStorage.removeItem(this.REMEMBER_KEY);
  }

  // Actualizar timestamp de sesión
  static updateSessionTimestamp(): void {
    if (typeof window === 'undefined') return;
    
    const timestamp = Date.now().toString();
    localStorage.setItem(this.SESSION_TIMESTAMP_KEY, timestamp);
    console.log('🔄 Timestamp de sesión actualizado:', new Date(parseInt(timestamp)));
  }
} 