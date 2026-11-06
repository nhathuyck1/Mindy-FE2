'use client';

import { useLinkStatus } from 'next/link';
import { Spinner } from './spinner';

export function LinkLoadingIcon(props: { children: React.ReactNode }) {
  const { pending } = useLinkStatus();
  return pending ? (
    <span role="status" aria-label="Đang chuyển trang">
      <Spinner />
    </span>
  ) : (
    props.children
  );
}
