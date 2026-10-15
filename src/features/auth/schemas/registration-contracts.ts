import { z } from 'zod';

export const registerSchema = z
  .object({
    displayName: z.string().min(1).max(150).regex(/\S/),
    email: z.email().max(320),
    password: z.string().min(6).max(128),
  })
  .strict();
export const registrationAcceptedSchema = z.object({ message: z.string() });
export const verifyEmailSchema = z.object({ token: z.string().min(32).max(512) }).strict();
