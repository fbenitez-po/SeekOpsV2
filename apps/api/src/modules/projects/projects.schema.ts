import { z } from 'zod';

export const CreateProjectSchema = z.object({
  codigo: z.string().regex(/^[a-zA-Z0-9-]{1,20}$/, 'El código debe ser alfanumérico (guiones permitidos, máx. 20 caracteres)'),
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  cliente_id: z.string().uuid('El cliente seleccionado no es válido'),
  gestor_id: z.string().uuid('El gestor seleccionado no es válido'),
  segmentacion_id: z.string().uuid('La segmentación seleccionada no es válida'),
  categorias_proyecto_ids: z.array(z.string().uuid('Cada categoría debe ser un valor válido')).nullish(),
  capa_productividad_id: z.string().uuid().nullish(),
  tipo_servicio_id: z.string().uuid().nullish(),
  area_id: z.string().uuid().nullish(),
  fecha_inicio: z.string().date().nullish(),
  fecha_fin: z.string().date().nullish(),
  fecha_inicio_real: z.string().date().nullish(),
  fecha_fin_real: z.string().date().nullish(),
  activo: z.boolean().optional(),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export const AssignUsersSchema = z.object({
  usuarios: z.array(z.object({
    usuario_id: z.string().uuid('El usuario seleccionado no es válido'),
    rol: z.enum(['SEEKER', 'GESTOR'], { error: 'El rol debe ser SEEKER o GESTOR' }),
  })).min(1, 'Debe incluir al menos un usuario'),
});

export const ListProjectsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  activo: z.string().optional(),
  cliente_id: z.string().uuid().optional(),
  gestor_id: z.string().uuid().optional(),
  search: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type AssignUsersInput = z.infer<typeof AssignUsersSchema>;
export type ListProjectsQuery = z.infer<typeof ListProjectsQuerySchema>;
