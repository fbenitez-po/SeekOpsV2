import { z } from 'zod';

export const CreateClientSchema = z.object({
  razon_social: z.string().min(1, 'La razón social es requerida').max(150, 'Máximo 150 caracteres'),
  razon_comercial: z.string().max(150).nullish(),
  ruc: z.string().regex(/^\d{11,14}$/, 'El RUC debe tener entre 11 y 14 dígitos'),
  nombre_contacto: z.string().max(100).nullish(),
  email_contacto: z.string().email('El email de contacto no es válido').nullish(),
  telefono: z.string().max(20).nullish(),
  direccion: z.string().max(200).nullish(),
  segmentacion_id: z.string().uuid('La segmentación seleccionada no es válida'),
  sector_id: z.string().uuid().nullish(),
  activo: z.boolean().optional(),
});

export const UpdateClientSchema = z.object({
  razon_social: z.string().min(1).max(150).optional(),
  razon_comercial: z.string().max(150).nullish(),
  ruc: z.string().regex(/^\d{11,14}$/).optional(),
  nombre_contacto: z.string().max(100).nullish(),
  email_contacto: z.string().email().nullish(),
  telefono: z.string().max(20).nullish(),
  direccion: z.string().max(200).nullish(),
  segmentacion_id: z.string().uuid().optional(),
  sector_id: z.string().uuid().nullish(),
  activo: z.boolean().optional(),
});

export const ListClientsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  activo: z.string().optional(),
  search: z.string().optional(),
  segmentacion_id: z.string().uuid().optional(),
});

export type CreateClientInput = z.infer<typeof CreateClientSchema>;
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;
export type ListClientsQuery = z.infer<typeof ListClientsQuerySchema>;
