'use client';
import { Group, Rect, Text } from 'react-konva';
import { tokenLines } from '@/features/code-assignments/lib/code-highlight';
import { CODE_FONT, CODE_PALETTE, codeMetrics } from '../lib/code-board';
import type { BoardShape } from '../schemas/whiteboard-contracts';

/** A code block on the board: dark card, language header, monospace tokens coloured per kind. */
export function WhiteboardCodeBlock(props: {
  shape: Extract<BoardShape, { type: 'code' }>;
  width: number;
  height: number;
}) {
  const { shape, width, height } = props;
  const m = codeMetrics(shape.fontSize);
  const visible = Math.max(1, Math.floor((height - m.header - m.pad) / m.lineHeight));
  const lines = tokenLines(shape.text, shape.language).slice(0, visible);
  return (
    <Group
      clipFunc={(ctx) => {
        ctx.beginPath();
        ctx.roundRect(0, 0, width, height, 10);
        ctx.closePath();
      }}
    >
      <Rect width={width} height={height} fill={CODE_PALETTE.bg} />
      <Rect width={width} height={m.header} fill={CODE_PALETTE.header} />
      <Text
        x={m.pad}
        y={0}
        height={m.header}
        verticalAlign="middle"
        text={shape.language === 'java21' ? 'Java' : 'JavaScript'}
        fontFamily={CODE_FONT}
        fontSize={Math.round(shape.fontSize * 0.85)}
        fill={CODE_PALETTE.muted}
        listening={false}
      />
      {lines.map((line, row) => {
        let column = 0;
        return line.map((token, i) => {
          const x = m.pad + column * m.charWidth;
          column += token.text.length;
          if (!token.text.trim()) return null;
          return (
            <Text
              key={`${row}-${i}`}
              x={x}
              y={m.header + m.pad + row * m.lineHeight}
              text={token.text}
              fontFamily={CODE_FONT}
              fontSize={shape.fontSize}
              fontStyle={token.kind === 'comment' || token.kind === 'doctag' ? 'italic' : 'normal'}
              fill={CODE_PALETTE[token.kind]}
              listening={false}
            />
          );
        });
      })}
      <Rect
        width={width}
        height={height}
        cornerRadius={10}
        stroke={CODE_PALETTE.border}
        strokeWidth={1}
        listening={false}
      />
    </Group>
  );
}
