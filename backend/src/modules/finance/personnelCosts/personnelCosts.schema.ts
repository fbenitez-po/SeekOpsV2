import { z } from 'zod';

export const ListPersonnelCostsQuerySchema = z.object({
  periodo_id: z.string().uuid().optional(),
});

const baseBody = {
  periodo_id: z.string().uuid('periodo_id debe ser un UUID válido'),
  user_id: z.string().uuid('user_id debe ser un UUID válido'),
  remuneracion: z.coerce
    .number({ message: 'remuneracion es requerida' })
    .min(0, 'La remuneración no puede ser negativa'),
  dias_habiles: z.coerce
    .number({ message: 'dias_habiles es requerido' })
    .int('dias_habiles debe ser entero')
    .positive('Los días hábiles deben ser mayores a 0'),
  horas_por_dia: z.coerce
    .number()
    .positive('Las horas por día deben ser mayores a 0')
    .default(8),
};

export const PersonnelCostBodySchema = z.object(baseBody);

export const ImportPersonnelCostsBodySchema = z
  .array(PersonnelCostBodySchema)
  .min(1, 'Se debe enviar un array con al menos un registro');

export type PersonnelCostBody = z.infer<typeof PersonnelCostBodySchema>;
export type ListPersonnelCostsQuery = z.infer<typeof ListPersonnelCostsQuerySchema>;
