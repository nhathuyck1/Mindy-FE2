'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '../api/cart-queries';

export function CartLink() {
  const cart = useCart();
  const count = cart.isError ? undefined : cart.data?.items.length;
  return (
    <Button
      asChild
      variant="ghost"
      className="relative size-11 shrink-0 rounded-full px-0"
      aria-label={count ? `Giỏ hàng, ${count} lớp` : 'Giỏ hàng'}
    >
      <Link href="/cart">
        <ShoppingBag className="size-5" aria-hidden="true" />
        {Boolean(count) && (
          <Badge
            className="absolute -top-1 -right-1 min-w-5 justify-center px-1 text-[10px]"
            aria-hidden="true"
          >
            {count}
          </Badge>
        )}
      </Link>
    </Button>
  );
}
