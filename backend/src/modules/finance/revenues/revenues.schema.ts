import { z } from 'zod';

export const ListRevenuesQuerySchema = z.object({
  periodo_id: z.string().uuid().optional(),
});

export const CreateRevenueSchema = z.object({
  proyecto_id: z.string().uuid('proyecto_id debe ser un UUID válido'),
  periodo_id: z.string().uuid('periodo_id debe ser un UUID válido'),
  monto: z.coerce.number({ message: 'monto es requerido' }).min(0, 'El monto no puede ser negativo'),
});

export const UpdateRevenueSchema = z.object({
  monto: z.coerce.number({ message: 'monto es requerido' }).min(0, 'El monto no puede ser negativo'),
});

export const ImportRevenueRowSchema = z.object({
  code: z.unknown(),
  ingreso: z.unknown(),
  period: z.unknown(),
});

export const ImportRevenuesBodySchema = z
  .array(ImportRevenueRowSchema)
  .min(1, 'El cuerpo debe ser un array con al menos un registro');

export type ListRevenuesQuery = z.infer<typeof ListRevenuesQuerySchema>;
export type CreateRevenueInput = z.infer<typeof CreateRevenueSchema>;
export type UpdateRevenueInput = z.infer<typeof UpdateRevenueSchema>;
export type ImportRevenueRow = z.infer<typeof ImportRevenueRowSchema>;
