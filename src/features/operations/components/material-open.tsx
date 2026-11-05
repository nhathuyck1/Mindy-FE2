'use client';
import { useEffect } from 'react';
import { z } from 'zod';
import { apiRequest } from '@/lib/api/client';
export function recordMaterialOpen(
  classId: string,
  materialId: string,
  revision: number,
  signal?: AbortSignal,
): Promise<null> {
  return apiRequest({
    path: `materials/${materialId}/open`,
    method: 'POST',
    body: { classId, expectedRevision: revision },
    schema: z.null(),
    signal,
  });
}
/** Mount only in an explicitly opened content viewer, never in lists or previews/prefetch. */
export function MaterialOpen(props: { classId: string; materialId: string; revision: number }) {
  useEffect(() => {
    const controller = new AbortController();
    void recordMaterialOpen(
      props.classId,
      props.materialId,
      props.revision,
      controller.signal,
    ).catch(() => {
      /* A failed tracking command must not interrupt authorized content. */
    });
    return () => controller.abort();
  }, [props.classId, props.materialId, props.revision]);
  return null;
}
