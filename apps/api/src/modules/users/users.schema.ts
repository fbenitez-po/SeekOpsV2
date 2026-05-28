import { z } from 'zod';

const baseFields = z.object({
  nombres: z.string().min(1, 'El nombre es requerido').max(100),
  apellidos: z.string().min(1, 'Los apellidos son requeridos').max(100),
  numero_documento: z.string().regex(/^\d{6,20}$/, 'El número de documento debe tener entre 6 y 20 dígitos'),
  puesto: z.string().min(1, 'El puesto es requerido').max(100),
  celular: z.string().nullish(),
  equipo_id: z.string().uuid('El equipo seleccionado no es válido'),
  areas: z.array(z.string().uuid('Cada área debe ser un valor válido')).min(1, 'Debe seleccionar al menos un área'),
  fecha_ingreso: z.string().date('La fecha de ingreso no es válida'),
  grupos: z.array(z.string()).min(1, 'Debe seleccionar al menos un grupo'),
  activo: z.boolean().optional(),
  staff: z.boolean().optional(),
  super_usuario: z.boolean().optional(),
  avatar_url: z.string().url().nullish(),
});

export const CreateUserSchema = baseFields.extend({
  email: z.string().email('El email no tiene un formato válido'),
});

export const UpdateUserSchema = baseFields.partial();

export const ListUsersQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  activo: z.string().optional(),
  search: z.string().optional(),
  equipo_id: z.string().uuid().optional(),
  grupo: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type ListUsersQuery = z.infer<typeof ListUsersQuerySchema>;
