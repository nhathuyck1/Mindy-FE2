'use client';
import { useEffect, useState } from 'react';
import { Image as KonvaImage, Rect, Text, Group } from 'react-konva';
import { apiRequest } from '@/lib/api/client';
import { boardAccessSchema, type BoardShape } from '../schemas/whiteboard-contracts';

export function WhiteboardImage(props: {
  boardId: string;
  shape: Extract<BoardShape, { type: 'image' }>;
}) {
  const [theme] = useState(() => {
    const s = getComputedStyle(document.documentElement);
    return {
      soft: s.getPropertyValue('--color-soft').trim(),
      forest: s.getPropertyValue('--color-forest').trim(),
    };
  });
  const [image, setImage] = useState<HTMLImageElement | null>(null),
    [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let img: HTMLImageElement | undefined, timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const access = await apiRequest({
          path: `whiteboards/${props.boardId}/assets/${props.shape.assetId}/access`,
          method: 'POST',
          schema: boardAccessSchema,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (!controller.signal.aborted) {
            setImage(img ?? null);
            setError(false);
          }
        };
        img.onerror = () => {
          if (!controller.signal.aborted) setError(true);
        };
        img.src = access.url;
        timer = setTimeout(() => void load(), 50000);
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    };
    void load();
    return () => {
      controller.abort();
      clearTimeout(timer);
      if (img) {
        img.onload = null;
        img.onerror = null;
        img.src = '';
      }
    };
  }, [props.boardId, props.shape.assetId]);
  if (image)
    return <KonvaImage image={image} width={props.shape.width} height={props.shape.height} />;
  return (
    <Group>
      <Rect width={props.shape.width} height={props.shape.height} fill={theme.soft} />
      <Text
        width={props.shape.width}
        padding={12}
        text={error ? 'Không tải được ảnh. Mở lại bảng để thử lại.' : 'Đang tải ảnh…'}
        fill={theme.forest}
        fontFamily="Nunito Variable"
      />
    </Group>
  );
}
