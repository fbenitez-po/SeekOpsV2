import 'zod-openapi';
import { z } from 'zod';

// Response contract for the dashboard `project` resource. Preserves the v1
// double-underscore keys. Fields removed in the v2 redesign (status, tier,
// evaluations, image, polls, category names, comments_date) are always null.
export const DashboardProjectSchema = z
  .object({
    code: z.string(),
    layer_productivity__name: z.string().nullable(),
    name: z.string(),
    client__business_name: z.string().nullable(),
    client__business_reason: z.string(),
    client__business_number: z.string(),
    client__sector__name: z.string().nullable(),
    client__segmentation__name: z.string().nullable(),
    start_date: z.string().nullable(),
    end_date: z.string().nullable(),
    real_start_date: z.string().nullable(),
    real_end_date: z.string().nullable(),
    manager__first_name: z.string().nullable(),
    manager__last_name: z.string().nullable(),
    manager__document_number: z.string().nullable(),
    status: z.null(),
    category__name: z.null(),
    image: z.null(),
    flag_poll: z.null(),
    category_extension__name: z.null(),
    category__iframe_poll: z.null(),
    created_at: z.string(),
    evaluation_internal: z.null(),
    evaluation_external: z.null(),
    tier: z.null(),
    comments_date: z.null(),
  })
  .meta({ id: 'DashboardProject' });

export const DashboardProjectListSchema = z.array(DashboardProjectSchema);

export type DashboardProject = z.infer<typeof DashboardProjectSchema>;
