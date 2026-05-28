import { z } from 'zod';

export const AdminExpenseBodySchema = z.object({
  periodo_id: z.string().uuid('periodo_id debe ser un UUID válido'),
  codigo: z.string().trim().min(1, 'codigo es requerido'),
  descripcion: z.string().trim().nullish(),
  monto: z.coerce.number({ message: 'monto es requerido' }).min(0, 'El monto no puede ser negativo'),
});

export const ListAdminExpensesQuerySchema = z.object({
  periodo_id: z.string().uuid().optional(),
});

export type AdminExpenseBody = z.infer<typeof AdminExpenseBodySchema>;
export type ListAdminExpensesQuery = z.infer<typeof ListAdminExpensesQuerySchema>;
