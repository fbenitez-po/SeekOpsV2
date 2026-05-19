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

const LineaAdjustSchema = z.object({
  id: z.string().uuid('Una de las líneas tiene un identificador inválido'),
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

export const CreateTimeEntrySchema = z.object({
  semana: z.string().regex(/^S\d{2}\/\d{2}$/, 'La semana debe tener formato S15/26'),
  lineas: z.array(LineaCreateSchema).min(1, 'Debe agregar al menos una línea de horas'),
});

export const AdjustTimeEntrySchema = z.object({
  lineas: z.array(LineaAdjustSchema).min(1, 'Debe incluir al menos una línea'),
});

export const ApproveWithObservationSchema = z.object({
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
  razon_rechazo: z.string().min(1, 'La razón de rechazo es requerida'),
  permitir_reenvio: z.boolean().optional(),
});

export type CreateTimeEntryInput = z.infer<typeof CreateTimeEntrySchema>;
export type AdjustTimeEntryInput = z.infer<typeof AdjustTimeEntrySchema>;
export type ApproveWithObservationInput = z.infer<typeof ApproveWithObservationSchema>;
export type RejectInput = z.infer<typeof RejectSchema>;
