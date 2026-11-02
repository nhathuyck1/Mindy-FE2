'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiRequest } from '@/lib/api/client';
import { authResponseSchema } from '@/lib/api/contracts';
import {
  registerSchema,
  registrationAcceptedSchema,
  verifyEmailSchema,
} from '../schemas/registration-contracts';
import { withAuthChange } from '@/lib/api/session-coordinator';
import { sessionKey } from './auth-queries';

export function useRegister() {
  return useMutation({
    mutationFn: (input: z.infer<typeof registerSchema>) =>
      apiRequest({
        path: 'auth/register',
        method: 'POST',
        body: registerSchema.parse(input),
        schema: registrationAcceptedSchema,
      }),
  });
}

export function useVerifyEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) =>
      withAuthChange(
        () =>
          apiRequest({
            path: 'auth/email/verify',
            method: 'POST',
            body: verifyEmailSchema.parse({ token }),
            schema: authResponseSchema,
          }),
        true,
      ),
    onSuccess: (result) => {
      queryClient.clear();
      queryClient.setQueryData(sessionKey, result.user);
    },
  });
}
