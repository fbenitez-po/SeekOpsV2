import { z } from 'zod';

const horasMultiple = (v: number) => v % 0.5 === 0;

const LineaCreateSchema = z.object({
  proyecto_id: z.string().uuid('El proyecto seleccionado no es válido'),
  categoria_ingreso_id: z.string().uuid().nullish(),
  horas: z
    .number()
    .min(0, 'Las horas deben ser un número mayor o igual a 0')
    .refine(horasMultiple, 'Las horas deben ser múltiplo de 0.5'),
  horas_extra: z
    .number()
    .min(0, 'Las horas extra deben estar entre 0 y 8')
    .max(8, 'Las horas extra deben estar entre 0 y 8')
    .refine(horasMultiple, 'Las horas extra deben ser múltiplo de 0.5')
    .optional(),
  comentario: z.string().optional(),
});

const MS_DAY = 86400000;

function esLunesUTC(iso: string): boolean {
  return new Date(`${iso}T00:00:00Z`).getUTCDay() === 1;
}

export const CreateTimeEntrySchema = z
  .object({
    semana_inicio: z.string().date('semana_inicio debe ser una fecha ISO (YYYY-MM-DD)'),
    semana_fin: z.string().date('semana_fin debe ser una fecha ISO (YYYY-MM-DD)'),
    lineas: z.array(LineaCreateSchema).min(1, 'Debe agregar al menos una línea de horas'),
  })
  .refine((d) => esLunesUTC(d.semana_inicio), {
    message: 'semana_inicio debe ser un día lunes',
    path: ['semana_inicio'],
  })
  .refine(
    (d) =>
      new Date(`${d.semana_fin}T00:00:00Z`).getTime() -
        new Date(`${d.semana_inicio}T00:00:00Z`).getTime() ===
      6 * MS_DAY,
    { message: 'semana_fin debe ser el domingo de la misma semana (semana_inicio + 6 días)', path: ['semana_fin'] },
  );

export const ApproveSchema = z.object({
  proyecto_id: z.string().uuid('El proyecto indicado no es válido'),
  categoria_ingreso_id: z.string().uuid().nullish(),
});

export const ApproveWithObservationSchema = z.object({
  proyecto_id: z.string().uuid('El proyecto indicado no es válido'),
  categoria_ingreso_id: z.string().uuid().nullish(),
  comentario_observacion: z.string().min(1, 'El comentario es requerido'),
  lineas: z
    .array(
      z.object({
        id: z.string().uuid(),
        horas: z.number().min(0).refine(horasMultiple, 'Las horas deben ser múltiplo de 0.5'),
        horas_extra: z
          .number()
          .min(0)
          .max(8)
          .refine(horasMultiple, 'Las horas extra deben ser múltiplo de 0.5')
          .optional(),
      }),
    )
    .optional(),
  sugerencia_horas: z.number().optional(),
  sugerencia_extras: z.number().optional(),
});

export const RejectSchema = z.object({
  proyecto_id: z.string().uuid('El proyecto indicado no es válido'),
  categoria_ingreso_id: z.string().uuid().nullish(),
  razon_rechazo: z.string().min(1, 'La razón de rechazo es requerida'),
  permitir_reenvio: z.boolean().optional(),
});

export type CreateTimeEntryInput = z.infer<typeof CreateTimeEntrySchema>;
export type ApproveInput = z.infer<typeof ApproveSchema>;
export type ApproveWithObservationInput = z.infer<typeof ApproveWithObservationSchema>;
export type RejectInput = z.infer<typeof RejectSchema>;
