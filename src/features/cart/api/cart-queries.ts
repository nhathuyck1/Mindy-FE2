'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api/client';
import { addCartItemSchema, cartSchema } from '../schemas/cart-contracts';

export function useAddCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (classId: string) =>
      apiRequest({
        path: 'me/cart/items',
        method: 'POST',
        schema: cartSchema,
        body: addCartItemSchema.parse({ classId }),
      }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['catalog'] }),
  });
}
