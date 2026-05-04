import { RefreshTokenCallback } from '../../AppWrapper';

/**
 * Gestor global del callback de refresh token
 * Permite acceder al callback fuera de componentes React
 */
class RefreshTokenManager {
  private callback: RefreshTokenCallback | undefined;

  /**
   * Establece el callback de refresh token
   */
  setCallback(callback: RefreshTokenCallback | undefined) {
    this.callback = callback;
    if (callback) {
      console.log('🔄 Callback de refresh token registrado globalmente');
    }
  }

  /**
   * Obtiene el callback de refresh token
   */
  getCallback(): RefreshTokenCallback | undefined {
    return this.callback;
  }

  /**
   * Ejecuta el callback de refresh token si está disponible
   */
  async refreshToken(): Promise<{ token: string; refreshToken: string } | null> {
    if (!this.callback) {
      console.warn('⚠️ No hay callback de refresh token disponible');
      return null;
    }

    try {
      console.log('🔄 Ejecutando refresh token...');
      const result = await this.callback();
      console.log('✅ Token refrescado exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error al refrescar el token:', error);
      throw error;
    }
  }
}

// Exportar instancia única (singleton)
export const refreshTokenManager = new RefreshTokenManager();

