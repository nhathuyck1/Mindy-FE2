import { z } from 'zod';

const count = z.number().int().nonnegative();
export const dashboardQuerySchema = z
  .object({
    days: z.coerce
      .number()
      .pipe(z.union([z.literal(30), z.literal(90), z.literal(365)]))
      .default(90),
  })
  .strict();
const rankSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  registrations: count,
  students: count,
  classes: count,
});
export const dashboardSchema = z.object({
  scope: z.enum(['ADMIN', 'MANAGER', 'MENTOR']),
  timeZone: z.literal('Asia/Ho_Chi_Minh'),
  generatedAt: z.iso.datetime(),
  from: z.iso.datetime(),
  to: z.iso.datetime(),
  summary: z.object({
    courses: count,
    classes: count,
    openClasses: count,
    activeClasses: count,
    registrations: count,
    students: count,
  }),
  courses: z.array(rankSchema).max(10),
  mentors: z.array(rankSchema).max(10),
  classes: z.array(rankSchema).max(10),
  trend: z.array(z.object({ date: z.iso.date(), registrations: count })).max(366),
  classStatuses: z
    .array(
      z.object({
        status: z.enum(['DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
        count,
      }),
    )
    .max(5),
});
export type Dashboard = z.infer<typeof dashboardSchema>;
export type DashboardAudience = 'admin' | 'manager' | 'mentor';

export function dashboardSchemaFor(audience: DashboardAudience) {
  return dashboardSchema.refine((value) => value.scope === audience.toUpperCase(), {
    message: 'Dữ liệu dashboard không đúng vai trò.',
  });
}
