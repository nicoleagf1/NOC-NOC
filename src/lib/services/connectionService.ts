import { query } from '@/lib/db';
import { encrypt, decrypt, MASK, isMasked } from '@/lib/security';
import { MonitoringConnection, ConnectionDTO } from '@/lib/types/connection';

/**
 * Mapea el resultado de la base de datos a un DTO.
 * Oculta las credenciales sensibles con una máscara.
 */
function mapToDTO(row: any, maskCredentials = true): ConnectionDTO {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    url: row.url,
    authType: row.auth_type,
    // Enviamos la máscara si hay credenciales y queremos enmascarar
    authCredentials: row.auth_credentials 
      ? (maskCredentials ? MASK : decrypt(row.auth_credentials)) 
      : '',
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const connectionService = {
  /**
   * Obtiene todas las conexiones.
   * Por defecto, devuelve las credenciales enmascaradas (seguro para el frontend).
   */
  async getAllConnections(maskCredentials = true): Promise<ConnectionDTO[]> {
    const res = await query('SELECT * FROM monitoring_connections ORDER BY created_at DESC');
    return res.rows.map(row => mapToDTO(row, maskCredentials));
  },

  /**
   * Obtiene una conexión específica por ID.
   */
  async getConnectionById(id: string, maskCredentials = true): Promise<ConnectionDTO | null> {
    const res = await query('SELECT * FROM monitoring_connections WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return mapToDTO(res.rows[0], maskCredentials);
  },

  /**
   * Obtiene la primera conexión activa de un tipo específico.
   * Utilizado internamente por los clientes (e.g. prometheusClient) por lo que devuelve la credencial DESENMASCARADA.
   */
  async getActiveConnection(type: 'prometheus' | 'uptime-kuma'): Promise<ConnectionDTO | null> {
    const res = await query(
      'SELECT * FROM monitoring_connections WHERE type = $1 AND is_active = TRUE LIMIT 1',
      [type]
    );
    if (res.rows.length === 0) return null;
    return mapToDTO(res.rows[0], false); // Falso para obtener el token real decodificado
  },

  /**
   * Crea una nueva conexión. Las credenciales se cifran antes de guardarse.
   */
  async createConnection(data: Partial<MonitoringConnection>): Promise<ConnectionDTO> {
    const { name, type, url, authType = 'none', authCredentials, isActive = true } = data;
    
    let encryptedCreds = null;
    if (authType !== 'none' && authCredentials) {
      encryptedCreds = encrypt(authCredentials);
    }

    const res = await query(
      `INSERT INTO monitoring_connections (name, type, url, auth_type, auth_credentials, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, type, url, authType, encryptedCreds, isActive]
    );

    return mapToDTO(res.rows[0], true);
  },

  /**
   * Actualiza una conexión. 
   * Si las credenciales provienen como máscara (••••••••), se ignoran para no corromper la BD.
   */
  async updateConnection(id: string, data: Partial<MonitoringConnection>): Promise<ConnectionDTO | null> {
    const current = await this.getConnectionById(id, false);
    if (!current) return null;

    const name = data.name !== undefined ? data.name : current.name;
    const type = data.type !== undefined ? data.type : current.type;
    const url = data.url !== undefined ? data.url : current.url;
    const authType = data.authType !== undefined ? data.authType : current.authType;
    const isActive = data.isActive !== undefined ? data.isActive : current.isActive;
    
    // Lógica para no sobrescribir con la máscara
    let newEncryptedCreds = current.authCredentials ? encrypt(current.authCredentials) : null;
    if (data.authCredentials !== undefined) {
      if (isMasked(data.authCredentials)) {
        // No hacemos nada, mantenemos el valor anterior (ya cifrado en BD, que no lo tenemos aquí así que necesitamos 
        // traerlo crudo de la BD de nuevo, o simplemente no actualizar este campo).
        // Para simplificar, obtenemos la fila cruda de la BD:
        const rawRes = await query('SELECT auth_credentials FROM monitoring_connections WHERE id = $1', [id]);
        newEncryptedCreds = rawRes.rows[0].auth_credentials;
      } else if (data.authCredentials === '') {
        newEncryptedCreds = null;
      } else {
        newEncryptedCreds = encrypt(data.authCredentials);
      }
    }

    const res = await query(
      `UPDATE monitoring_connections 
       SET name = $1, type = $2, url = $3, auth_type = $4, auth_credentials = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [name, type, url, authType, newEncryptedCreds, isActive, id]
    );

    return mapToDTO(res.rows[0], true);
  },

  /**
   * Elimina una conexión.
   */
  async deleteConnection(id: string): Promise<boolean> {
    const res = await query('DELETE FROM monitoring_connections WHERE id = $1 RETURNING id', [id]);
    return res.rows.length > 0;
  }
};
