import { z } from 'zod';

export const ListCommercialQuerySchema = z.object({
  proyecto_id: z.string().uuid().optional(),
});

export const CommercialBodySchema = z.object({
  fecha_registro: z.string().min(1, 'fecha_registro es requerida'),
  proyecto_id: z.string().uuid('proyecto_id debe ser un UUID válido'),
  responsable_id: z.string().uuid('responsable_id debe ser un UUID válido'),
  precio: z.coerce.number({ message: 'precio es requerido' }).min(0, 'El precio no puede ser negativo'),
  detalle: z.string().trim().nullish(),
  tipo_documento_id: z.string().uuid().nullish(),
  estado_contrato: z.boolean().optional(),
  facturacion: z.boolean().optional(),
  evidencia_nombre: z.string().trim().nullish(),
});

export type ListCommercialQuery = z.infer<typeof ListCommercialQuerySchema>;
export type CommercialBody = z.infer<typeof CommercialBodySchema>;
