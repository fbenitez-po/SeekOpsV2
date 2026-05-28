import 'zod-openapi';
import { z } from 'zod';

// Response contract for the dashboard `seekers` resource (v1-frozen English keys).
// Single source of truth: feeds the OpenAPI doc AND types the mapper return via
// z.infer — tsc fails if the mapper diverges from this shape.
export const DashboardSeekerSchema = z
  .object({
    email: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    job: z.string().nullable(),
    cellphone: z.string().nullable(),
    document_number: z.string().nullable(),
    team: z.string().nullable(),
    is_active: z.boolean(),
  })
  .meta({ id: 'DashboardSeeker' });

export const DashboardSeekerListSchema = z.array(DashboardSeekerSchema);

export type DashboardSeeker = z.infer<typeof DashboardSeekerSchema>;
