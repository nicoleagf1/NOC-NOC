import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'El usuario o correo es obligatorio'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
  turnstileToken: z.string().optional()
});

export const recoverPasswordSchema = z.object({
  emailOrUsername: z.string().min(1, 'Falta el usuario o correo')
});

export const resetPasswordSchema = z.object({
  id: z.string().min(1, 'El ID de usuario es obligatorio'),
  token: z.string().min(1, 'El token es obligatorio'),
  newPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

export const changePasswordSchema = z.object({
  userId: z.string().min(1, 'El ID de usuario es obligatorio'),
  newPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

export const createUserSchema = z.object({
  roleId: z.number().int().positive('El rol es obligatorio'),
  username: z.string().min(3, 'El username debe tener al menos 3 caracteres'),
  email: z.string().email('Debe ser un correo válido'),
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().min(1, 'El apellido es obligatorio'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional()
});

export const updateUserSchema = z.object({
  roleId: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  isTwoFactorEnabled: z.boolean().optional()
});

export const createConnectionSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  type: z.enum(['prometheus', 'uptime-kuma', 'fortigate']),
  url: z.string().url('Debe ser una URL válida'),
  authType: z.enum(['none', 'basic', 'bearer']).optional().default('none'),
  authCredentials: z.string().optional(),
  isActive: z.boolean().optional().default(true)
});

export const updateConnectionSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['prometheus', 'uptime-kuma', 'fortigate']).optional(),
  url: z.string().url().optional(),
  authType: z.enum(['none', 'basic', 'bearer']).optional(),
  authCredentials: z.string().optional(),
  isActive: z.boolean().optional()
});
