import { z } from 'zod';
const count = z.number().int().nonnegative();
const money = z.string().regex(/^\d+$/);
const base = z.object({
  timeZone: z.string(),
  generatedAt: z.iso.datetime(),
  from: z.iso.datetime(),
  to: z.iso.datetime(),
});
const group = z.object({ id: z.string(), name: z.string(), amount: money, orders: count });
export const managerDashboardSchema = base.extend({
  scope: z.literal('MANAGER'),
  summary: z.object({
    collectedAmount: money,
    paidOrders: count,
    pendingAmount: money,
    pendingOrders: count,
  }),
  paymentMethods: z.array(group),
  courses: z.array(group),
  classes: z.array(group),
  trend: z.array(z.object({ date: z.iso.date(), amount: money, orders: count })),
  reconciliation: z.array(z.object({ orderId: z.uuid(), amount: money, reason: z.string() })),
  openingAlerts: z.array(
    z.object({
      classId: z.uuid(),
      className: z.string(),
      scheduledStartAt: z.string(),
      activeStudentCount: count,
      missingStudents: count,
    }),
  ),
});
export const mentorDashboardSchema = base.extend({
  scope: z.literal('MENTOR'),
  summary: z.object({
    primaryClasses: count,
    students: count,
    assignedSessions: count,
    substituteSessions: count,
    completedSessions: count,
    actualTeachingHours: z.number().nonnegative(),
  }),
  upcoming: z.array(
    z.object({
      sessionId: z.uuid(),
      classId: z.uuid(),
      title: z.string(),
      startsAt: z.string(),
      endsAt: z.string(),
    }),
  ),
  leaveRequests: z.array(z.object({ status: z.string(), count })),
});
