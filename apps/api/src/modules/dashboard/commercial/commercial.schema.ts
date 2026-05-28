import 'zod-openapi';
import { z } from 'zod';

// Response contract for the dashboard `commercial` resource. Preserves the v1
// double-underscore keys from Django's `.values(...)`. Fields with no v2 source
// (type, division__name, duration) are always null — documented as such.
export const DashboardCommercialSchema = z
  .object({
    date: z.string(),
    detail: z.string().nullable(),
    price: z.number(),
    coin: z.string(),
    type: z.null(),
    document: z.string().nullable(),
    status: z.boolean(),
    billing: z.boolean(),
    division__name: z.null(),
    project__name: z.string(),
    project__code: z.string(),
    project__client__business_name: z.string().nullable(),
    project__client__business_number: z.string(),
    project__client__business_reason: z.string(),
    project__client__sector__name: z.string().nullable(),
    project__client__segmentation__name: z.string().nullable(),
    project__category__name: z.string().nullable(),
    project__manager__first_name: z.string().nullable(),
    responsible__first_name: z.string(),
    responsible__last_name: z.string(),
    responsible__document_number: z.string().nullable(),
    duration: z.null(),
  })
  .meta({ id: 'DashboardCommercial' });

export const DashboardCommercialListSchema = z.array(DashboardCommercialSchema);

export type DashboardCommercial = z.infer<typeof DashboardCommercialSchema>;
