import { z } from 'zod';

const horasMultiple = (v: number) => v % 0.5 === 0;

export const CreateProjectionSchema = z.object({
  project_id: z.string().uuid('El proyecto seleccionado no es válido'),
  user_id: z.string().uuid('El usuario seleccionado no es válido'),
  fecha_inicio: z.string().date('La fecha de inicio no es válida (YYYY-MM-DD)'),
  fecha_fin: z.string().date('La fecha de fin no es válida (YYYY-MM-DD)'),
  horas_proyectadas: z
    .number()
    .positive('Las horas proyectadas deben ser mayor a 0')
    .refine(horasMultiple, 'Las horas proyectadas deben ser múltiplo de 0.5'),
  work_category_id: z.string().uuid().nullish(),
  notas: z.string().max(500, 'Las notas no pueden superar 500 caracteres').nullish(),
});

export const UpdateProjectionSchema = z.object({
  fecha_inicio: z.string().date().optional(),
  fecha_fin: z.string().date().optional(),
  horas_proyectadas: z
    .number()
    .positive()
    .refine(horasMultiple, 'Las horas proyectadas deben ser múltiplo de 0.5')
    .optional(),
  work_category_id: z.string().uuid().nullish(),
  notas: z.string().max(500).nullish(),
});

export type CreateProjectionInput = z.infer<typeof CreateProjectionSchema>;
export type UpdateProjectionInput = z.infer<typeof UpdateProjectionSchema>;
