import { z } from 'zod';
export const realtimeChannelSchema = z.enum(['chat', 'whiteboards']);
export type RealtimeChannel = z.infer<typeof realtimeChannelSchema>;
export const realtimeTicketInputSchema = z.object({ channel: realtimeChannelSchema }).strict();
export const realtimeTicketSchema = z.object({
  ticket: z.string().min(1).max(4096),
  expiresAt: z.iso.datetime({ offset: true }),
});
export const realtimeConnectionSchema = realtimeTicketSchema.extend({ url: z.url() });
