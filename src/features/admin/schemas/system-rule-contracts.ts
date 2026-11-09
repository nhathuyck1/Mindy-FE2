import { z } from 'zod';

export const systemRuleSchema = z.object({
  key: z.literal('session_start_time_enforced'),
  value: z.boolean(),
  version: z.number().int().positive(),
  updatedAt: z.iso.datetime({ offset: true }),
  updatedBy: z.uuid().nullable(),
});
export const systemRulesSchema = z.array(systemRuleSchema);
export const updateSystemRuleSchema = z
  .object({
    value: z.boolean(),
    expectedVersion: z.number().int().positive(),
    reason: z.string().trim().min(1).max(1000),
  })
  .strict();
