'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useSession } from '@/features/auth/api/auth-queries';
import { apiRequest } from '@/lib/api/client';
import { addCartItemSchema, cartSchema } from '../schemas/cart-contracts';

export const cartKey = (userId?: string) => ['cart', userId] as const;

export function useCart() {
  const session = useSession();
  return useQuery({
    queryKey: cartKey(session.data?.id),
    enabled: session.isSuccess && session.data?.role === 'STUDENT',
    queryFn: ({ signal }) => apiRequest({ path: 'me/cart', schema: cartSchema, signal }),
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: true,
  });
}

export function useAddCartItem() {
  const queryClient = useQueryClient();
  const session = useSession();
  return useMutation({
    mutationFn: (classId: string) =>
      apiRequest({
        path: 'me/cart/items',
        method: 'POST',
        schema: cartSchema,
        body: addCartItemSchema.parse({ classId }),
      }),
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKey(session.data?.id), cart);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['catalog'] }),
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (classId: string) =>
      apiRequest({
        path: `me/cart/items/${z.uuid().parse(classId)}`,
        method: 'DELETE',
        schema: z.null(),
      }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });
}
