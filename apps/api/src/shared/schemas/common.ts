import { z } from 'zod';

export const IdParamSchema = z.object({
  id: z.string().uuid('id debe ser un UUID válido'),
});

export type IdParam = z.infer<typeof IdParamSchema>;
