import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.APP_SECRET;

if (!JWT_SECRET) {
  throw new Error('APP_SECRET must be defined in environment variables');
}

const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface SessionPayload {
  userId: string;
  username: string;
  roleId: number;
  mustChangePassword?: boolean;
}

export const authService = {
  /**
   * Genera el hash de una contraseña plana
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  },

  /**
   * Compara una contraseña plana con su hash en la base de datos
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  /**
   * Genera un JSON Web Token (JWT) firmado
   */
  async signToken(payload: SessionPayload): Promise<string> {
    const alg = 'HS256';
    return new SignJWT({ ...payload })
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime('12h') // Sesión de 12 horas
      .sign(secretKey);
  },

  /**
   * Verifica la validez de un JWT y extrae su payload
   */
  async verifyToken(token: string): Promise<SessionPayload | null> {
    try {
      const { payload } = await jwtVerify(token, secretKey);
      return payload as unknown as SessionPayload;
    } catch (error) {
      return null;
    }
  }
};
