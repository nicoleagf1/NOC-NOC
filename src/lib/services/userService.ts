import { query } from '@/lib/db';
import { authService } from './authService';

export interface UserDTO {
  id: string;
  roleId: number;
  roleName: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  mustChangePassword?: boolean;
  lastLoginAt?: string;
}

export const userService = {
  /**
   * Obtiene todos los usuarios junto con el nombre de su rol (excluyendo hashes de contraseñas)
   */
  async getAllUsers(): Promise<UserDTO[]> {
    const res = await query(`
      SELECT u.id, u.role_id, r.name as role_name, u.username, u.email, u.first_name, u.last_name, u.is_active, u.must_change_password, u.last_login_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `);
    
    return res.rows.map(row => ({
      id: row.id,
      roleId: row.role_id,
      roleName: row.role_name,
      username: row.username,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      isActive: row.is_active,
      mustChangePassword: row.must_change_password,
      lastLoginAt: row.last_login_at
    }));
  },

  /**
   * Obtiene todos los roles disponibles
   */
  async getRoles() {
    const res = await query('SELECT id, name, description FROM roles ORDER BY id ASC');
    return res.rows;
  },

  /**
   * Obtiene un usuario completo (incluyendo hash, usado internamente por auth)
   */
  async getUserByUsername(username: string) {
    const res = await query('SELECT * FROM users WHERE username = $1 LIMIT 1', [username]);
    if (res.rows.length === 0) return null;
    return res.rows[0];
  },

  /**
   * Crea un nuevo usuario. La contraseña inicial será proporcionada o autogenerada.
   */
  async createUser(data: Partial<UserDTO> & { password?: string }): Promise<UserDTO | null> {
    const { roleId, username, email, firstName, lastName, password } = data;
    
    // Si no se provee clave, la clave por defecto es el mismo usuario.
    const rawPassword = password || username || 'nocnoc123';
    const hash = await authService.hashPassword(rawPassword);

    try {
      const res = await query(`
        INSERT INTO users (role_id, username, email, password_hash, first_name, last_name, must_change_password)
        VALUES ($1, $2, $3, $4, $5, $6, TRUE)
        RETURNING id
      `, [roleId, username, email, hash, firstName, lastName]);
      
      const newUserId = res.rows[0].id;
      
      // Consultamos de nuevo para obtener el DTO completo con el role_name
      const newUserRes = await query(`
        SELECT u.id, u.role_id, r.name as role_name, u.username, u.email, u.first_name, u.last_name, u.is_active, u.must_change_password
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = $1
      `, [newUserId]);

      const row = newUserRes.rows[0];
      return {
        id: row.id,
        roleId: row.role_id,
        roleName: row.role_name,
        username: row.username,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        isActive: row.is_active,
        mustChangePassword: row.must_change_password
      };
    } catch (e: any) {
      console.error("Error creating user", e);
      throw new Error(e.code === '23505' ? 'El usuario o correo ya existe.' : 'Error interno al crear usuario.');
    }
  },

  /**
   * Actualiza el estado o rol de un usuario existente
   */
  async updateUser(id: string, data: Partial<UserDTO>): Promise<boolean> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.roleId !== undefined) {
      updates.push(`role_id = $${paramIndex++}`);
      values.push(data.roleId);
    }
    if (data.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(data.isActive);
    }
    // Añade más campos si lo necesitas (email, nombre)
    
    if (updates.length === 0) return true;

    values.push(id);
    const queryStr = `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex}`;
    
    const res = await query(queryStr, values);
    return res.rowCount !== null && res.rowCount > 0;
  },
  
  /**
   * Cambia la contraseña (usado por el usuario mismo o reseteo del admin)
   */
  async changePassword(userId: string, newPasswordPlain: string): Promise<boolean> {
    const hash = await authService.hashPassword(newPasswordPlain);
    const res = await query(
      `UPDATE users SET password_hash = $1, must_change_password = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, 
      [hash, userId]
    );
    return res.rowCount !== null && res.rowCount > 0;
  },
  
  /**
   * Actualiza la fecha de último inicio de sesión
   */
  async updateLastLogin(userId: string): Promise<void> {
    await query(`UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1`, [userId]);
  }
};
