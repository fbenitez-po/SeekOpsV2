import 'zod-openapi';
import { z } from 'zod';

// Response contract for the dashboard `clients` resource (v1-frozen English keys).
// `legal_address` is always null (v2 collapsed fiscal/legal into one address).
export const DashboardClientSchema = z
  .object({
    id: z.string(),
    business_reason: z.string(),
    business_name: z.string().nullable(),
    business_number: z.string(),
    fiscal_address: z.string().nullable(),
    legal_address: z.null(),
    segmentation: z.string(),
    sector: z.string().nullable(),
  })
  .meta({ id: 'DashboardClient' });

export const DashboardClientListSchema = z.array(DashboardClientSchema);

export type DashboardClient = z.infer<typeof DashboardClientSchema>;
