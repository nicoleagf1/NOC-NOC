import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

function getSecretKey() {
  const JWT_SECRET = process.env.APP_SECRET;
  if (!JWT_SECRET) {
    throw new Error('APP_SECRET must be defined in environment variables');
  }
  return new TextEncoder().encode(JWT_SECRET);
}

function getRawSecret() {
  const JWT_SECRET = process.env.APP_SECRET;
  if (!JWT_SECRET) {
    throw new Error('APP_SECRET must be defined in environment variables');
  }
  return JWT_SECRET;
}

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
      .sign(getSecretKey());
  },

  /**
   * Verifica la validez de un JWT y extrae su payload
   */
  async verifyToken(token: string): Promise<SessionPayload | null> {
    try {
      const { payload } = await jwtVerify(token, getSecretKey());
      return payload as unknown as SessionPayload;
    } catch (error) {
      return null;
    }
  },

  /**
   * Genera un JWT stateless para la recuperación de contraseña
   * Utiliza el hash de la contraseña actual como parte del secreto
   * para invalidar el token en cuanto se cambie la contraseña.
   */
  async signRecoveryToken(userId: string, currentPasswordHash: string): Promise<string> {
    const alg = 'HS256';
    const dynamicSecret = new TextEncoder().encode(`${getRawSecret()}-${currentPasswordHash}`);
    return new SignJWT({ userId, purpose: 'password_reset' })
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime('1h') // Válido por 1 hora
      .sign(dynamicSecret);
  },

  /**
   * Verifica el token de recuperación usando el hash actual.
   */
  async verifyRecoveryToken(token: string, currentPasswordHash: string): Promise<{ userId: string } | null> {
    try {
      const dynamicSecret = new TextEncoder().encode(`${getRawSecret()}-${currentPasswordHash}`);
      const { payload } = await jwtVerify(token, dynamicSecret);
      if (payload.purpose !== 'password_reset') return null;
      return payload as unknown as { userId: string };
    } catch (error) {
      return null;
    }
  }
};
