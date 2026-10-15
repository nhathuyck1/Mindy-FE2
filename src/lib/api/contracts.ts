import { z } from 'zod';

export const userSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  displayName: z.string(),
  phone: z.string().nullable(),
  role: z.enum(['ADMIN', 'MANAGER', 'MENTOR', 'STUDENT']),
  status: z.enum(['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED']),
  lastLoginAt: z.string().nullable(),
  createdAt: z.string(),
});
export type User = z.infer<typeof userSchema>;
export const authResponseSchema = z.object({ user: userSchema, accessTokenExpiresAt: z.string() });
export const loginSchema = z
  .object({
    email: z.email().max(320),
    password: z.string().min(1).max(128),
    deviceName: z.string().max(150).optional(),
  })
  .strict();
