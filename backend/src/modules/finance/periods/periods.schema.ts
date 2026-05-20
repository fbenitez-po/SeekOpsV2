import { z } from 'zod';

export const TogglePeriodParamsSchema = z.object({
  id: z.string().uuid('id debe ser un UUID válido'),
});

export type TogglePeriodParams = z.infer<typeof TogglePeriodParamsSchema>;
