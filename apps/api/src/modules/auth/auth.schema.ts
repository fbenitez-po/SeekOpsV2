import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('El email ingresado no es válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const RefreshSchema = z.object({
  refresh_token: z.string().min(1, 'El token de sesión es requerido'),
});

export const SolicitarResetSchema = z.object({
  email: z.string().email('El email ingresado no es válido'),
});

export const ConfirmarResetSchema = z.object({
  token: z.string().min(1, 'El token de recuperación es requerido'),
  nueva_password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmar_password: z.string().min(1, 'La confirmación de contraseña es requerida'),
});

export const LogoutSchema = z.object({
  refresh_token: z.string().optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshInput = z.infer<typeof RefreshSchema>;
export type SolicitarResetInput = z.infer<typeof SolicitarResetSchema>;
export type ConfirmarResetInput = z.infer<typeof ConfirmarResetSchema>;
export type LogoutInput = z.infer<typeof LogoutSchema>;
